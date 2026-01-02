import mongoose, { Document, Schema } from "mongoose";

function buildSKU(...parts: string[]) {
  console.log(parts);
  return parts
    .filter(Boolean)
    .join("-")
    .toUpperCase()
    .trim()
    .replaceAll(/\s/g, "_");
}

export function calculateTotalStock(variants: ISizeVariant[]) {
  return variants.reduce((sum, size) => {
    return (
      sum +
      size.materials.reduce((mSum, mat) => {
        return (
          mSum +
          mat.colors.reduce(
            (cSum, c) => cSum + c.stocks.reduce((s, x) => s + x.stock, 0),
            0
          )
        );
      }, 0)
    );
  }, 0);
}

function syncVariationOptions(variants: ISizeVariant[]) {
  const map = new Map<string, Set<string>>();

  for (const size of variants) {
    if (!map.has("size")) map.set("size", new Set());
    map.get("size")!.add(size.size);

    for (const mat of size.materials) {
      if (!map.has("material")) map.set("material", new Set());
      map.get("material")!.add(mat.name);

      for (const color of mat.colors) {
        if (!map.has("color")) map.set("color", new Set());
        map.get("color")!.add(color.name);
      }
    }
  }

  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

/* ===================== ENUMS ===================== */

export enum ProductSize {
  STANDARD = "STANDARD",
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  EXTRA_LARGE = "EXTRA_LARGE",
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum Unit {
  PCS = "PCS",
  ML = "ML",
  LTR = "LTR",
  G = "G",
  KG = "KG",
  PACK = "PACK",
  BOX = "BOX",
}

/* ===================== PRODUCT IMAGES ===================== */

export interface IProductImage extends Document {
  image_url: string;
  is_primary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    image_url: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ProductImageSchema.index({ is_primary: 1 });

/* ===================== VARIANTS ===================== */

export interface IStoreStock {
  store_id: mongoose.Types.ObjectId;
  stock: number;
}

export interface IColorVariant {
  name: string;
  value?: string;
  id: string;
  sku: string; // 👈 ADDED
  image_url?: string;
  stocks: IStoreStock[];
}

export interface IMaterialVariant {
  name: string; // JEANS, LEATHER
  id: string; // JEANS, LEATHER
  sku: string;
  cost_price: number; // 👈 PRICE LEVEL
  price: number; // 👈 PRICE LEVEL
  colors: IColorVariant[];
}

export interface ISizeVariant {
  size: ProductSize; // STANDARD, SMALL, LARGE
  id: ProductSize; // STANDARD, SMALL, LARGE
  sku: string;
  materials: IMaterialVariant[];
}

const StoreStockSchema = new Schema<IStoreStock>(
  {
    store_id: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    stock: { type: Number, min: 0, required: true },
  },
  { _id: false }
);
const ColorSchema = new Schema<IColorVariant>(
  {
    name: { type: String, required: true },
    value: { type: String, default: null },
    id: { type: String, required: true },
    sku: { type: String, required: true }, // 👈 ADDED
    image_url: String,
    stocks: { type: [StoreStockSchema], default: [] },
  },
  { _id: false }
);

const MaterialSchema = new Schema<IMaterialVariant>(
  {
    name: { type: String, required: true },
    id: { type: String, required: true },
    sku: { type: String, required: true },
    cost_price: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    colors: { type: [ColorSchema], default: [] },
  },
  { _id: false }
);

const SizeSchema = new Schema<ISizeVariant>(
  {
    size: {
      type: String,
      enum: Object.values(ProductSize),
      required: true,
    },
    id: { type: String, required: true },
    sku: { type: String, required: true },
    materials: { type: [MaterialSchema], default: [] },
  },
  { _id: false }
);

/* ===================== VARIATION OPTIONS (UI META) ===================== */

export interface IVariationOption {
  name: string;
  values: string[];
}

const VariationOptionSchema = new Schema<IVariationOption>(
  {
    name: { type: String, required: true },
    values: [{ type: String, required: true }],
  },
  { _id: false }
);

/* ===================== PRODUCT ===================== */

export interface IProduct extends Document {
  product_id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;

  cost_price: number;
  selling_price: number; // fallback price (non-variant products)
  quantity_in_stock: number; // used only if has_variants = false

  unit: Unit;
  status: ProductStatus;
  stocks: IStoreStock[];

  category_id?: string;
  brand_id?: string;

  images: IProductImage[];

  has_variants: boolean;
  variants: ISizeVariant[];
  variation_options: IVariationOption[];

  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    product_id: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `prod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    },

    name: { type: String, required: true, index: true },

    sku: { type: String, required: true, unique: true },

    barcode: { type: String, unique: true, sparse: true },

    description: String,

    cost_price: { type: Number, default: 0 },

    selling_price: {
      type: Number,
      default: 0, // used when has_variants = false
    },

    quantity_in_stock: {
      type: Number,
      default: 0,
      // index: true,
    },

    unit: {
      type: String,
      enum: Object.values(Unit),
      default: Unit.PCS,
    },

    stocks: { type: [StoreStockSchema], default: [] },

    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
      index: true,
    },

    category_id: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      index: true,
    },
    brand_id: {
      type: Schema.Types.ObjectId,
      ref: "ProductBrand",
      index: true,
    },

    images: {
      type: [ProductImageSchema],
      default: [],
    },

    has_variants: {
      type: Boolean,
      default: false,
    },

    variants: {
      type: [SizeSchema],
      default: [],
    },

    variation_options: {
      type: [VariationOptionSchema],
      default: [],
    },

    /* price_history: [
      {
        price: Number,
        changed_at: {
          type: Date,
          default: Date.now,
        },
      },
    ], */
  },
  {
    timestamps: true,
    collection: "products",
  }
);

/* ===================== INDEXES ===================== */
ProductSchema.index({ "variants.size": 1 });
ProductSchema.index({ "variants.materials.name": 1 });
ProductSchema.index({ "variants.materials.price": 1 });
ProductSchema.index({ "variants.materials.colors.name": 1 });
ProductSchema.index({ quantity_in_stock: 1 });
ProductSchema.index({ status: 1, category_id: 1 });
ProductSchema.index({ createdAt: -1 });

/* ===================== MIDDLEWARES ===================== */

ProductSchema.pre("validate", function (next) {
  if (!this.has_variants) return next();

  // 🟢 Ensure at least STANDARD size
  if (!this.variants.length) {
    this.variants.push({
      size: ProductSize.STANDARD,
      id: ProductSize.STANDARD,
      sku: "",
      materials: [],
    });
  }

  const sizeSet = new Set();

  for (const size of this.variants) {
    // ❌ Duplicate size
    if (sizeSet.has(size.size)) {
      return next(new Error(`Duplicate size: ${size.size}`));
    }
    sizeSet.add(size.size);

    // Size SKU
    size.sku = buildSKU(`(${this.sku})`, size.size);
    size.id = size.size.replaceAll(" ", "_").toUpperCase() as ProductSize;

    // 🟢 No material → DEFAULT material
    if (!size.materials || !size.materials.length) {
      size.materials = [
        {
          name: "DEFAULT",
          id: "DEFAULT",
          sku: buildSKU(size.sku),
          cost_price: this.cost_price || 0,
          price: this.selling_price || 0,
          colors: [],
        },
      ];
    }

    const materialSet = new Set();

    for (const mat of size.materials) {
      // ❌ Duplicate material
      if (materialSet.has(mat.name)) {
        return next(
          new Error(`Duplicate material ${mat.name} in size ${size.size}`)
        );
      }
      materialSet.add(mat.name);

      mat.sku = buildSKU(size.sku, mat.name);
      mat.id = mat.name.replaceAll(" ", "_").toUpperCase();

      if (mat.price < 0) {
        return next(new Error(`Negative price: ${mat.sku}`));
      }

      if (mat.cost_price !== undefined && mat.cost_price < 0) {
        return next(new Error(`Negative cost price: ${mat.sku}`));
      }

      const colorSet = new Set();
      for (const color of mat.colors) {
        // ❌ Duplicate color
        if (colorSet.has(color.name)) {
          return next(
            new Error(
              `Duplicate color ${color.name} in mat ${mat.name} size ${size.size}`
            )
          );
        }
        colorSet.add(color.name);

        color.sku = buildSKU(mat.sku, color.name);
        color.id = color.name.replaceAll(" ", "_").toUpperCase();
      }
    }
  }

  next();
});

ProductSchema.pre("save", function (next) {
  if (this.has_variants) {
    this.quantity_in_stock = calculateTotalStock(this.variants);
    this.variation_options = syncVariationOptions(this.variants);
  } else {
    // If no variants, sum up stock from stores if available
    if (this.stocks && this.stocks.length > 0) {
      this.quantity_in_stock = this.stocks.reduce((sum, s) => sum + s.stock, 0);
    }
    this.variation_options = [];
  }

  next();
});

ProductSchema.virtual("min_price").get(function () {
  if (!this.has_variants) return this.selling_price;
  const prices = this.variants.flatMap((v) => v.materials.map((m) => m.price));
  return prices.length > 0 ? Math.min(...prices) : this.selling_price;
});

ProductSchema.virtual("max_price").get(function () {
  if (!this.has_variants) return this.selling_price;
  const prices = this.variants.flatMap((v) => v.materials.map((m) => m.price));
  return prices.length > 0 ? Math.max(...prices) : this.selling_price;
});

ProductSchema.virtual("total_stock").get(function () {
  if (!this.has_variants) return this.quantity_in_stock;
  return calculateTotalStock(this.variants);
});

// ====================== MODEL ===================== //
export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
