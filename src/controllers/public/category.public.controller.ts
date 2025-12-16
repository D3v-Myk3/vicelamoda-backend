import { StatusCodes } from "http-status-codes";
import { logger } from "../../configs/logger.configs";
import { paginationConfig } from "../../configs/pagination.config";
import { CategoryModel } from "../../models/mongoose/Category.model";
import { FetchCategoriesType } from "../../types/category.type";
import { CustomRequest } from "../../types/general.types";

/**
 * Public controller to fetch categories - uses Mongoose
 * Returns only display fields: category_id, name, abbreviation, description
 */
export const fetchPublicCategoriesController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchCategoriesType>,
  res: any
): Promise<void> => {
  const source = "FETCH PUBLIC CATEGORIES CONTROLLER";
  try {
    const { cursor, limit: queryLimit, search, name, abbreviation } = req.query;

    const limit = Number(queryLimit) || paginationConfig.defaultLimit;

    // Build MongoDB query
    const query: any = {};

    // Specific filters
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }
    if (abbreviation) {
      query.abbreviation = { $regex: abbreviation, $options: "i" };
    }

    // General search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { abbreviation: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Cursor-based pagination
    if (cursor) {
      query.$or = query.$or || [];
      query.$or.push(
        { createdAt: { $lt: new Date() } },
        { category_id: { $lt: cursor } }
      );
    }

    // Fetch categories with Mongoose
    const categories = await CategoryModel.find(query)
      .select("category_id name abbreviation description")
      .sort({ createdAt: -1, category_id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    // Determine next cursor
    let nextCursor: string | null = null;
    if (categories.length > limit) {
      const nextItem = categories.pop();
      nextCursor = nextItem?.category_id ?? null;
    }

    logger.info(`Public categories fetched successfully`, {
      source,
      count: categories.length,
    });

    res.status(StatusCodes.OK).json({
      data: categories,
      message: "Categories fetched successfully",
      pagination: {
        nextCursor,
        hasNextPage: !!nextCursor,
      },
    });
  } catch (error) {
    logger.error(`Error fetching public categories`, {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      data: null,
      message: "Failed to fetch categories",
    });
  }
};
