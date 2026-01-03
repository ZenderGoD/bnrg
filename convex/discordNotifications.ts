"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendPaymentNotification = internalAction({
  args: {
    type: v.union(v.literal("initiated"), v.literal("completed"), v.literal("partial")),
    orderNumber: v.number(),
    customerEmail: v.string(),
    amount: v.number(),
    amountPaid: v.optional(v.number()),
    paymentMethod: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_SYSTEM;
    
    if (!webhookUrl) {
      console.warn("⚠️ DISCORD_WEBHOOK_SYSTEM environment variable not set. Discord notifications disabled.");
      return;
    }

    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    interface DiscordEmbed {
      title: string;
      description?: string;
      fields: Array<{ name: string; value: string; inline: boolean }>;
      color: number;
      footer?: { text: string };
      timestamp: string;
    }
    
    let embed: DiscordEmbed;

    if (args.type === "initiated") {
      embed = {
        title: "💰 New Payment Pending",
        description: `A customer has initiated payment. QR code is active for 5 minutes.`,
        fields: [
          { name: "Order Number", value: `#${args.orderNumber}`, inline: true },
          { name: "Customer", value: args.customerEmail || "Unknown", inline: true },
          { name: "Amount", value: `₹${args.amount.toFixed(2)}`, inline: true },
          { name: "Payment Method", value: args.paymentMethod, inline: true },
        ],
        color: 0xffa500, // Orange
        footer: {
          text: "TOESPRING Payment System",
        },
        timestamp: new Date().toISOString(),
      };
    } else if (args.type === "completed") {
      const amountPaid = args.amountPaid ?? args.amount;
      embed = {
        title: "✅ Payment Completed",
        description: `Full payment received for order #${args.orderNumber}`,
        fields: [
          { name: "Order Number", value: `#${args.orderNumber}`, inline: true },
          { name: "Customer", value: args.customerEmail || "Unknown", inline: true },
          { name: "Total Amount", value: `₹${args.amount.toFixed(2)}`, inline: true },
          { name: "Amount Paid", value: `₹${amountPaid.toFixed(2)}`, inline: true },
          { name: "Status", value: args.status, inline: true },
        ],
        color: 0x00ff00, // Green
        footer: {
          text: "TOESPRING Payment System",
        },
        timestamp: new Date().toISOString(),
      };
    } else { // partial
      const amountPaid = args.amountPaid ?? 0;
      embed = {
        title: "⚠️ Partial Payment",
        description: `Partial payment of ₹${amountPaid.toFixed(2)} received. Remaining: ₹${(args.amount - amountPaid).toFixed(2)}`,
        fields: [
          { name: "Order Number", value: `#${args.orderNumber}`, inline: true },
          { name: "Customer", value: args.customerEmail || "Unknown", inline: true },
          { name: "Total Amount", value: `₹${args.amount.toFixed(2)}`, inline: true },
          { name: "Amount Paid", value: `₹${amountPaid.toFixed(2)}`, inline: true },
          { name: "Status", value: args.status, inline: true },
        ],
        color: 0xffa500, // Orange
        footer: {
          text: "TOESPRING Payment System",
        },
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Discord webhook failed: ${response.status} ${response.statusText}`, errorText);
      } else {
        console.log("✅ Discord notification sent successfully");
      }
    } catch (error) {
      console.error("❌ Failed to send Discord notification:", error);
    }
  },
});

export const sendAuthorizationRequestNotification = internalAction({
  args: {
    userId: v.id("users"),
    userEmail: v.string(),
    userName: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_SYSTEM;
    
    if (!webhookUrl) {
      console.warn("⚠️ DISCORD_WEBHOOK_SYSTEM environment variable not set. Discord notifications disabled.");
      return;
    }

    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const embed = {
      title: "🔐 Authorization Request",
      description: `A user has requested authorization to view locked content.`,
      fields: [
        { name: "User", value: args.userName || "Unknown", inline: true },
        { name: "Email", value: args.userEmail || "Unknown", inline: true },
        { name: "User ID", value: args.userId, inline: false },
      ],
      color: 0x3498db, // Blue
      footer: {
        text: "TOESPRING Authorization System",
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Discord webhook failed: ${response.status} ${response.statusText}`, errorText);
      } else {
        console.log("✅ Discord authorization request notification sent successfully");
      }
    } catch (error) {
      console.error("❌ Failed to send Discord notification:", error);
    }
  },
});

