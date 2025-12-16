import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { OrderModel } from "../models/mongoose/Order.model";
import { ProductModel } from "../models/mongoose/Product.model";
import { UserModel } from "../models/mongoose/User.model";
import { AdminDashboardStats } from "../types/dashboard.types";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";

export const getDashboardStatsService: ServiceFunctionParamType<
  unknown,
  AdminDashboardStats
> = async (_params, _context) => {
  const source = "GET DASHBOARD STATS SERVICE";
  logger.info("Starting getDashboardStatsService");

  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfLastMonth = new Date(currentYear, currentMonth, 0);

    // ================= OVERVIEW STATS =================

    // 1. Total Revenue
    // Using aggregation to sum total_amount of all orders
    const revenueResult = await OrderModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" },
        },
      },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Last month revenue for trend
    const lastMonthRevenueResult = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" },
        },
      },
    ]);
    const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;

    // Current month revenue
    const currentMonthRevenueResult = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total_amount" },
        },
      },
    ]);
    const currentMonthRevenue = currentMonthRevenueResult[0]?.total || 0;

    // 2. Total Orders
    const totalOrders = await OrderModel.countDocuments();
    const lastMonthOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const currentMonthOrders = await OrderModel.countDocuments({
      createdAt: { $gte: startOfCurrentMonth },
    });

    // 3. Customers
    const totalCustomers = await UserModel.countDocuments({ role: "CUSTOMER" });
    const lastMonthCustomers = await UserModel.countDocuments({
      role: "CUSTOMER",
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const currentMonthCustomers = await UserModel.countDocuments({
      role: "CUSTOMER",
      createdAt: { $gte: startOfCurrentMonth },
    });

    // 4. Avg Order Value (Total Revenue / Total Orders)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    // Approximate trend for Avg Order Value based on month-over-month comparison
    const lastMonthAvgOrderValue =
      lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0;
    const currentMonthAvgOrderValue =
      currentMonthOrders > 0 ? currentMonthRevenue / currentMonthOrders : 0;

    // Helper to calculate trend percentage
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
    };

    const overview = [
      {
        label: "Total Revenue",
        value: `$${totalRevenue.toLocaleString()}`,
        icon: "DollarSign",
        trend: calculateTrend(currentMonthRevenue, lastMonthRevenue),
      },
      {
        label: "Total Orders",
        value: totalOrders.toLocaleString(),
        icon: "ShoppingBag",
        trend: calculateTrend(currentMonthOrders, lastMonthOrders),
      },
      {
        label: "Customers",
        value: totalCustomers.toLocaleString(),
        icon: "Users",
        trend: calculateTrend(currentMonthCustomers, lastMonthCustomers),
      },
      {
        label: "Avg. Order Value",
        value: `$${avgOrderValue.toFixed(2)}`,
        icon: "TrendingUp",
        trend: calculateTrend(
          currentMonthAvgOrderValue,
          lastMonthAvgOrderValue
        ),
      },
    ];

    // ================= CHARTS (Last 6 Months) =================
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(new Date(currentYear, currentMonth - i, 1));
    }

    const chartData = await Promise.all(
      months.map(async (date) => {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const revenueRes = await OrderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$total_amount" },
              count: { $sum: 1 },
            },
          },
        ]);

        return {
          month: date.toLocaleString("default", { month: "short" }),
          revenue: revenueRes[0]?.total || 0,
          orders: revenueRes[0]?.count || 0,
        };
      })
    );

    // ================= TOP PRODUCTS =================
    // Aggregating sold items from Orders
    // Unwind items array, group by product_id, sum quantity
    const topProductsRaw = await OrderModel.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          sales: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.line_total" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 4 },
    ]);

    // Populate product names
    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const product = await ProductModel.findOne({
          product_id: item._id,
        }).select("name");
        return {
          id: item._id,
          name: product?.name || "Unknown Product",
          sales: item.sales,
          revenue: item.revenue,
        };
      })
    );

    // ================= RECENT ORDERS =================
    const recentOrdersRaw = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "fullname")
      .lean();

    const recentOrders = recentOrdersRaw.map((order) => ({
      id: order.order_id,
      customer:
        order.shipping_address?.fullname ||
        (order.user as any)?.fullname ||
        "Guest",
      amount: `$${order.total_amount}`,
      status: order.fulfillment_status.toLowerCase(),
      date: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

    logger.info(`Dashboard stats fetched successfully`, {
      source,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: { overview, chartData, topProducts, recentOrders },
        message: "Dashboard stats fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};
