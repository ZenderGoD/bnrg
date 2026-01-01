import { query } from "./_generated/server";

// Get dashboard analytics
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const [allUsers, allOrders, allProducts] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("orders").collect(),
      ctx.db.query("products").collect(),
    ]);

    // Calculate revenue
    const totalRevenue = allOrders
      .filter((o) => o.financialStatus === "paid")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Calculate pending revenue
    const pendingRevenue = allOrders
      .filter((o) => o.financialStatus === "pending")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Recent orders (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentOrders = allOrders.filter((o) => o.createdAt >= thirtyDaysAgo);
    const recentRevenue = recentOrders
      .filter((o) => o.financialStatus === "paid")
      .reduce((sum, o) => sum + o.totalPrice, 0);

    // Calculate inventory
    const totalInventory = allProducts.reduce((sum, product) => {
      return sum + product.variants.reduce((vSum, variant) => {
        return vSum + (variant.quantity || 0);
      }, 0);
    }, 0);

    // Low stock products (quantity < 10)
    const lowStockProducts = allProducts.filter((product) => {
      return product.variants.some((variant) => (variant.quantity || 0) < 10);
    });

    // User stats
    const totalUsers = allUsers.length;
    const adminUsers = allUsers.filter((u) => u.role === "admin" || u.role === "manager").length;
    const customerUsers = allUsers.filter((u) => (u.role || "customer") === "customer").length;

    // Order stats
    const totalOrders = allOrders.length;
    const fulfilledOrders = allOrders.filter((o) => o.fulfillmentStatus === "fulfilled").length;
    const pendingOrders = allOrders.filter((o) => o.fulfillmentStatus === "unfulfilled").length;

    // Top selling products
    const productSales: Record<string, { productId: string; title: string; sales: number; revenue: number }> = {};
    allOrders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        if (!productSales[productId]) {
          const product = allProducts.find((p) => p._id === productId);
          productSales[productId] = {
            productId,
            title: product?.title || "Unknown",
            sales: 0,
            revenue: 0,
          };
        }
        productSales[productId].sales += item.quantity;
        productSales[productId].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);

    return {
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
        recent: recentRevenue,
      },
      users: {
        total: totalUsers,
        admins: adminUsers,
        customers: customerUsers,
      },
      orders: {
        total: totalOrders,
        fulfilled: fulfilledOrders,
        pending: pendingOrders,
        recent: recentOrders.length,
      },
      inventory: {
        total: totalInventory,
        lowStock: lowStockProducts.length,
      },
      topProducts,
    };
  },
});



