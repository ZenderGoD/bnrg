"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendContactMessage = action({
  args: {
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_SYSTEM;
    
    if (!discordWebhookUrl) {
      throw new Error("Discord webhook URL not configured. Please set DISCORD_WEBHOOK_SYSTEM environment variable in Convex dashboard or via: npx convex env set DISCORD_WEBHOOK_SYSTEM <your-webhook-url>");
    }

    const timestamp = new Date().toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const embed = {
      title: "📧 New Contact Form Submission",
      color: 0x5865F2, // Discord blue
      fields: [
        {
          name: "Email",
          value: args.email,
          inline: false,
        },
        {
          name: "Message",
          value: args.message.length > 1024 
            ? args.message.substring(0, 1021) + "..."
            : args.message,
          inline: false,
        },
        {
          name: "Timestamp",
          value: timestamp,
          inline: false,
        },
      ],
      footer: {
        text: "MONTE VELORIS Contact Form",
      },
    };

    const payload = {
      embeds: [embed],
    };

    try {
      const response = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord API error: ${response.status} ${errorText}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending message to Discord:", error);
      throw new Error("Failed to send message. Please try again later.");
    }
  },
});

