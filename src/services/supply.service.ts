import { StatusCodes } from "http-status-codes";
import { logger } from "../configs/logger.configs";
import { defaultError, handleErrors } from "../helpers/error.helpers";
import { ProductModel, SupplyModel } from "../models/mongoose";
import { StoreModel } from "../models/mongoose/Store.model";
import {
  fetchSingleSupplyModel,
  fetchSuppliesModel,
} from "../models/supply.models";
import {
  CreateSupplyFormType,
  UpdateSupplyFormType,
} from "../schemas/supply.zod.schemas";
import { CustomError, DefaultErrorReturn } from "../types/error.types";
import { ServiceFunctionParamType } from "../types/general.types";
import { ProductTblType } from "../types/product.type";
import {
  FetchSingleSupplyType,
  FetchSuppliesType,
  SupplyTblType,
} from "../types/supply.type";

export const createSupplyService: ServiceFunctionParamType<
  CreateSupplyFormType,
  SupplyTblType
> = async (params, { admin_data, manager_data }) => {
  const source = "CREATE SUPPLY SERVICE";
  logger.info("Starting createSupplyService", {
    body: params,
  });

  try {
    const supply_store_id = manager_data?.store || params.store_id;
    const recorded_by = manager_data?._id || admin_data?._id;

    if (!supply_store_id) {
      throw new CustomError({
        data: null,
        errorMessage: "Store ID is required",
        source,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    if (!recorded_by) {
      throw new CustomError({
        data: null,
        errorMessage: "User ID is required",
        source,
        status: StatusCodes.UNAUTHORIZED,
      });
    }

    // Validate store exists
    const store = await StoreModel.findOne({
      _id: supply_store_id,
    })
      .lean()
      .exec();

    if (!store) {
      logger.warn(`Store not found`, {
        source: `${source} (STAGE 1)`,
        store_id: supply_store_id,
        status: StatusCodes.BAD_REQUEST,
      });
      throw new CustomError({
        data: null,
        errorMessage: "Invalid Store",
        source: `${source} (STAGE 1)`,
        status: StatusCodes.BAD_REQUEST,
      });
    }

    // Prepare data for model layer
    /* const createSupplyData: CreateSupplyType = {
      ...params,
      recorded_by,
    }; */

    // Process products and their variations
    const supplyProducts = await Promise.all(
      params.items.map(async (item) => {
        const productResponse = await ProductModel.findOne<any>({
          _id: item.product_id,
        })
          .lean()
          .exec();

        const product = productResponse as unknown as ProductTblType;

        if (!product) {
          throw new CustomError({
            data: null,
            errorMessage: `Product ${item.product_id} not found`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        const variations: any[] = [];
        let calculatedTotalQuantity = 0;

        // If variations are provided, process them
        if (item.variations && item.variations.length > 0) {
          if (!product.has_variants) {
            throw new CustomError({
              data: null,
              errorMessage: `Product ${product.name} does not support variations`,
              source,
              status: StatusCodes.BAD_REQUEST,
            });
          }

          for (const vItem of item.variations) {
            let foundSize: any = null;
            let foundMaterial: any = null;
            let foundColor: any = null;

            for (const size of product.variants) {
              for (const mat of size.materials) {
                const color = mat.colors.find(
                  (c: any) => c.sku === vItem.variant_sku
                );
                if (color) {
                  foundSize = size;
                  foundMaterial = mat;
                  foundColor = color;
                  break;
                }
              }
              if (foundColor) break;
            }

            if (!foundColor) {
              throw new CustomError({
                data: null,
                errorMessage: `Variant SKU ${vItem.variant_sku} not found for product ${product.name}`,
                source,
                status: StatusCodes.BAD_REQUEST,
              });
            }

            variations.push({
              variant_sku: vItem.variant_sku,
              variant_name: `${foundSize.size} / ${foundMaterial.name} / ${foundColor.name}`,
              quantity: vItem.quantity,
            });
            calculatedTotalQuantity += vItem.quantity;
          }
        } else {
          // No variations, must be a simple product
          if (product.has_variants) {
            throw new CustomError({
              data: null,
              errorMessage: `Product ${product.name} requires variations`,
              source,
              status: StatusCodes.BAD_REQUEST,
            });
          }
          calculatedTotalQuantity = item.total_quantity;
        }

        // Validate provided total_quantity matches calculation
        if (calculatedTotalQuantity !== item.total_quantity) {
          throw new CustomError({
            data: null,
            errorMessage: `Total quantity mismatch for product ${product.name}. Provided: ${item.total_quantity}, Calculated: ${calculatedTotalQuantity}`,
            source,
            status: StatusCodes.BAD_REQUEST,
          });
        }

        return {
          product_id: item.product_id,
          quantity: item.total_quantity,
          date_supplied: new Date(params.date_supplied),
          variations,
        };
      })
    );

    // Create supply with products embedded
    const supplyData: any = {
      supplier_name: params.supplier_name,
      supplier_contact: params.supplier_contact,
      store_id: supply_store_id,
      recorded_by,
      date_supplied: new Date(params.date_supplied),
      products: supplyProducts,
    };

    const supply = await SupplyModel.create(supplyData);

    // Update product stock for each product and its variations
    for (const sProduct of supplyProducts) {
      const productDoc = await ProductModel.findOne({
        _id: sProduct.product_id,
      }).exec();

      if (!productDoc) continue; // Should not happen after validation above

      if (sProduct.variations && sProduct.variations.length > 0) {
        // Update stock for each variation
        for (const variation of sProduct.variations) {
          let matchedColor: any = null;

          // Find the variant directly in the document to ensure modification is tracked
          for (const size of productDoc.variants) {
            for (const mat of size.materials) {
              const color = mat.colors.find(
                (c: any) => c.sku === variation.variant_sku
              );
              if (color) {
                matchedColor = color;
                break;
              }
            }
            if (matchedColor) break;
          }

          if (matchedColor) {
            const storeStockIndex = matchedColor.stocks.findIndex(
              (s: any) => s.store_id === supply_store_id
            );

            if (storeStockIndex >= 0) {
              matchedColor.stocks[storeStockIndex].stock += variation.quantity;
            } else {
              matchedColor.stocks.push({
                store_id: supply_store_id as string,
                stock: variation.quantity,
              });
            }
          }
        }
        productDoc.markModified("variants");
      } else {
        // Simple product stock update
        productDoc.quantity_in_stock += sProduct.quantity;
      }

      await productDoc.save();
    }

    // Re-fetch the created supply
    // Note: products is an embedded array, so we can't populate it
    // The product_id, variant_sku, and variant_name are already stored in the embedded document
    const created = await SupplyModel.findById(supply._id).lean().exec();

    logger.info(`Supply created successfully`, {
      source,
      status: StatusCodes.CREATED,
    });

    return {
      data: {
        data: created as unknown as SupplyTblType,
        message: "Supply created successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.CREATED,
    };
  } catch (error: CustomError | unknown) {
    logger.info(`Error in supply creation`, {
      source: `${source} (ERROR)`,
      personnel: admin_data?.email || manager_data?.email,
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({
        error,
        source: `${source} (ERROR)`,
      }) as DefaultErrorReturn;
    } else {
      return defaultError(`${source} (ERROR)`, error as string);
    }
  }
};

/**
 * Internal helper to enrich supply with product details and current stock
 */
const enrichSupplies = async (supplies: any[]) => {
  return await Promise.all(
    supplies.map(async (supply: any) => {
      const enrichedProducts = await Promise.all(
        supply.products.map(async (sProduct: any) => {
          // sProduct.product_id might be a populated object or an ObjectId
          const pId = sProduct.product_id?._id || sProduct.product_id;

          const productDoc = await ProductModel.findById(pId).lean().exec();

          if (!productDoc) {
            return {
              ...sProduct,
              product: {
                product_name: "Unknown Product",
                sku: "N/A",
                selling_price: 0,
              },
              current_stock: 0,
            };
          }

          let current_stock = productDoc.quantity_in_stock;

          const enrichedVariations = sProduct.variations?.map((vItem: any) => {
            let vStock = 0;
            // Find variation in productDoc
            if (productDoc.variants) {
              for (const size of productDoc.variants) {
                for (const mat of size.materials) {
                  const color = mat.colors.find(
                    (c: any) => c.sku === vItem.variant_sku
                  );
                  if (color) {
                    vStock = color.stocks.reduce(
                      (sum: number, s: any) => sum + s.stock,
                      0
                    );
                    break;
                  }
                }
                if (vStock > 0) break;
              }
            }
            return { ...vItem, current_stock: vStock };
          });

          // For products with variations, the total stock is the sum of variations
          if (productDoc.has_variants && enrichedVariations) {
            current_stock = enrichedVariations.reduce(
              (sum: number, v: any) => sum + v.current_stock,
              0
            );
          }

          return {
            ...sProduct,
            product: {
              product_name: productDoc.name,
              sku: productDoc.sku,
              selling_price: productDoc.selling_price,
            },
            current_stock,
            variations: enrichedVariations,
          };
        })
      );
      return { ...supply, products: enrichedProducts };
    })
  );
};

export const fetchSuppliesService: ServiceFunctionParamType<
  FetchSuppliesType,
  SupplyTblType[]
> = async (params, { manager_data }) => {
  const source = "FETCH SUPPLIES SERVICE";
  logger.info("Starting fetchSuppliesService", {
    body: params,
  });

  try {
    // Update params with manager's recorded_by if available
    const fetchParams: FetchSuppliesType = {
      ...params,
      recorded_by: manager_data?._id || params.recorded_by,
    };

    // Call model layer to fetch supplies
    const modelResponse = await fetchSuppliesModel(fetchParams);

    if (modelResponse.errorMessage || !modelResponse.data) {
      logger.warn(`Failed to fetch supplies`, {
        source,
        errorMessage: modelResponse.errorMessage || "Error fetching supplies",
        status: modelResponse.status,
      });
      throw new CustomError({
        data: null,
        errorMessage: modelResponse.errorMessage || "Error fetching supplies",
        source,
        status: modelResponse.status,
      });
    }

    // Enrich with current stock data and product details
    const enrichedData = await enrichSupplies(modelResponse.data);

    logger.info(`Fetch supplies completed`, {
      source,
      params: params ?? {},
      found: modelResponse.data.length,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: enrichedData as unknown as SupplyTblType[],
        pagination: modelResponse.pagination || {
          nextCursor: null,
          hasNextPage: false,
        },
        message: "Supplies fetched successfully",
      },
      errorMessage: null,
      status: StatusCodes.OK,
      source,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const fetchSingleSupplyService: ServiceFunctionParamType<
  FetchSingleSupplyType,
  SupplyTblType
> = async (params) => {
  const source = "FETCH SINGLE SUPPLY SERVICE";
  logger.info("Starting fetchSingleSupplyService", { body: params });

  try {
    const modelResponse = await fetchSingleSupplyModel(params);

    if (modelResponse.errorMessage || !modelResponse.data) {
      throw new CustomError({
        data: null,
        errorMessage: modelResponse.errorMessage || "Supply not found",
        source: `${source} (STAGE 1)`,
        status: modelResponse.status,
      });
    }

    const supply = modelResponse.data as any;
    const enrichedSupply = (await enrichSupplies([supply]))[0];

    return {
      data: {
        data: enrichedSupply as unknown as SupplyTblType,
        message: "Supply fetched successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const updateSupplyService: ServiceFunctionParamType<
  { supply_id: string; update_data: UpdateSupplyFormType },
  SupplyTblType
> = async ({ supply_id, update_data }, { admin_data: _, manager_data: __ }) => {
  const source = "UPDATE SUPPLY SERVICE";
  logger.info("Starting updateSupplyService", {
    supply_id,
    update_data,
  });

  try {
    const supply = await SupplyModel.findOneAndUpdate(
      { _id: supply_id },
      { $set: update_data },
      { new: true }
    )
      .lean()
      .exec();

    if (!supply) {
      throw new CustomError({
        data: null,
        errorMessage: "Supply record not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    logger.info(`Supply record updated successfully`, {
      source,
      supply_id,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: supply as unknown as SupplyTblType,
        message: "Supply record updated successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};

export const deleteSupplyService: ServiceFunctionParamType<
  string,
  null
> = async (supply_id, { admin_data: _, manager_data: __ }) => {
  const source = "DELETE SUPPLY SERVICE";
  logger.info("Starting deleteSupplyService", {
    supply_id,
  });

  try {
    const supply = await SupplyModel.findOneAndDelete({ _id: supply_id });

    if (!supply) {
      throw new CustomError({
        data: null,
        errorMessage: "Supply record not found",
        source,
        status: StatusCodes.NOT_FOUND,
      });
    }

    logger.info(`Supply record deleted successfully`, {
      source,
      supply_id,
      status: StatusCodes.OK,
    });

    return {
      data: {
        data: null,
        message: "Supply record deleted successfully",
      },
      errorMessage: null,
      source,
      status: StatusCodes.OK,
    };
  } catch (error: CustomError | unknown) {
    if (error instanceof CustomError || error instanceof Error) {
      return handleErrors({ error, source }) as DefaultErrorReturn;
    } else {
      return defaultError(source, String(error));
    }
  }
};
