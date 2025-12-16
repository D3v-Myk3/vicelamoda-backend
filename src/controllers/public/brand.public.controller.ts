import { StatusCodes } from "http-status-codes";
import { logger } from "../../configs/logger.configs";
import { paginationConfig } from "../../configs/pagination.config";
import { BrandModel } from "../../models/mongoose/Brand.model";
import { FetchBrandsType } from "../../types/brand.type";
import { CustomRequest } from "../../types/general.types";

/**
 * Public controller to fetch brands - uses Mongoose
 * Returns only display fields: brand_id, name, abbreviation, description
 */
export const fetchPublicBrandsController = async (
  req: CustomRequest<unknown, unknown, unknown, FetchBrandsType>,
  res: any
): Promise<void> => {
  const source = "FETCH PUBLIC BRANDS CONTROLLER";
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
        { brand_id: { $lt: cursor } }
      );
    }

    // Fetch brands with Mongoose
    const brands = await BrandModel.find(query)
      .select("brand_id name abbreviation description")
      .sort({ createdAt: -1, brand_id: -1 })
      .limit(limit + 1)
      .lean()
      .exec();

    // Determine next cursor
    let nextCursor: string | null = null;
    if (brands.length > limit) {
      const nextItem = brands.pop();
      nextCursor = nextItem?.brand_id ?? null;
    }

    logger.info(`Public brands fetched successfully`, {
      source,
      count: brands.length,
    });

    res.status(StatusCodes.OK).json({
      data: brands,
      message: "Brands fetched successfully",
      pagination: {
        nextCursor,
        hasNextPage: !!nextCursor,
      },
    });
  } catch (error) {
    logger.error(`Error fetching public brands`, {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      data: null,
      message: "Failed to fetch brands",
    });
  }
};
