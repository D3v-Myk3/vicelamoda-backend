import mongoose, { Document, Schema } from "mongoose";

function generateVariantSKU(
  productSKU: string,
  size: string,
  attributes: { key: string; value: string }[] = []
) {
  const attrPart = attributes.map((a) => `${a.key}-${a.value}`).join("_");

  return [productSKU, size, attrPart].filter(Boolean).join("-").toUpperCase();
}

function calculateVariantStock(variant: any) {
  return (variant.stocks || []).reduce(
    (sum: number, s: any) => sum + s.stock,
    0
  );
}

function calculateTotalStock(variants: any[]) {
  return variants.reduce((sum, v) => sum + (calculateVariantStock(v) || 0), 0);
}

/* function syncVariationOptionsFromVariants(variants: any[]) {
  const map = new Map<string, Set<string>>();

  for (const variant of variants) {
    // size
    if (!map.has("size")) map.set("size", new Set());
    map.get("size")!.add(variant.size);

    // other attributes
    for (const attr of variant.attributes || []) {
      if (!map.has(attr.key)) map.set(attr.key, new Set());
      map.get(attr.key)!.add(attr.value);
    }
  }

  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
} */

function syncVariationOptionsFromVariants(
  variants: any[]
): { name: string; values: string[] }[] {
  const optionMap = new Map<string, Set<string>>();

  for (const variant of variants) {
    // Size (first-class)
    if (!optionMap.has("size")) {
      optionMap.set("size", new Set());
    }
    optionMap.get("size")!.add(variant.size);

    // Other attributes (color, material, etc.)
    for (const attr of variant.attributes || []) {
      if (!optionMap.has(attr.key)) {
        optionMap.set(attr.key, new Set());
      }
      optionMap.get(attr.key)!.add(attr.value);
    }
  }

  return Array.from(optionMap.entries()).map(([name, values]) => ({
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
  active = "active",
  inactive = "inactive",
}

export enum Unit {
  pcs = "pcs",
  ml = "ml",
  ltr = "ltr",
  g = "g",
  kg = "kg",
  pack = "pack",
  box = "box",
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

export interface IVariantAttribute {
  key: string;
  value: string;
}

export interface IStoreStock {
  store_id: string;
  stock: number;
}

export interface IPriceHistory {
  price: number;
  changed_at: Date;
}

export interface IProductVariant extends Document {
  sku: string;
  size: ProductSize; // 👈 SIZE-SPECIFIC
  attributes: IVariantAttribute[];
  price: number; // 👈 PRICE PER SIZE
  stocks: IStoreStock[];
  price_history: IPriceHistory[];
  image_url?: string;
  status: "active" | "inactive";
}

const VariantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true },

    size: {
      type: String,
      enum: Object.values(ProductSize),
      required: true,
    },

    attributes: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stocks: [
      {
        store_id: { type: String, required: true },
        stock: { type: Number, required: true, min: 0 },
      },
    ],

    price_history: [
      {
        price: { type: Number, required: true },
        changed_at: { type: Date, default: Date.now },
      },
    ],

    image_url: String,

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
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

  category_id?: string;
  brand_id?: string;

  images: IProductImage[];

  has_variants: boolean;
  variants: IProductVariant[];
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
        `prd_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
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
      index: true,
    },

    unit: {
      type: String,
      enum: Object.values(Unit),
      default: Unit.pcs,
    },

    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.active,
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
      type: [VariantSchema],
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
// ProductSchema.index({ category_id: 1 });
// ProductSchema.index({ brand_id: 1 });
// ProductSchema.index({ status: 1 });
// ProductSchema.index({ name: 1 });
// ProductSchema.index({ quantity_in_stock: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ "variants.size": 1 });
// ProductSchema.index({ "variants.sku": 1 });

/* ===================== MIDDLEWARES ===================== */

ProductSchema.pre("save", function (next) {
  if (!this.has_variants) {
    this.variation_options = [];
    return next();
  }

  if (!this.isModified("variants")) return next();

  // 🔁 Auto-sync variation options
  this.variation_options = syncVariationOptionsFromVariants(this.variants);

  // 📦 Auto-sync total stock
  this.quantity_in_stock = calculateTotalStock(this.variants);

  // 📦 Auto-sync price history
  this.variants.forEach((variant: any) => {
    const last = variant.price_history?.slice(-1)[0];

    if (!last || last.price !== variant.price) {
      variant.price_history = variant.price_history || [];
      variant.price_history.push({ price: variant.price });
    }
  });

  /*  const seenSizes = new Set<string>();

  for (const variant of this.variants) {
    // ❌ Duplicate size check
    if (seenSizes.has(variant.size)) {
      return next(
        new Error(`Duplicate variant size detected: ${variant.size}`)
      );
    }
    seenSizes.add(variant.size);

    // ❌ Invalid price
    if (variant.price < 0) {
      return next(
        new Error(`Variant price cannot be negative (SKU: ${variant.sku})`)
      );
    }

    // ❌ Invalid stock
    if (calculateVariantStock(variant) < 0) {
      return next(
        new Error(`Variant stock cannot be negative (SKU: ${variant.sku})`)
      );
    }
  } */

  next();
});

ProductSchema.pre("validate", function (next) {
  if (!this.has_variants) return next();

  if (this.isModified("variation_options") && !this.isModified("variants")) {
    this.invalidate(
      "variation_options",
      "variation_options is auto-generated and cannot be manually edited"
    );
  }

  const seenCombinations = new Set<string>();

  for (const variant of this.variants) {
    // SKU generation
    if (!variant.sku) {
      variant.sku = generateVariantSKU(
        this.sku,
        variant.size,
        variant.attributes
      );
    }

    // Prevent duplicate variants (same size + attributes)
    const comboKey = `${variant.size}-${JSON.stringify(variant.attributes || [])}`;
    if (seenCombinations.has(comboKey)) {
      return next(
        new Error(`Duplicate variant detected for size ${variant.size}`)
      );
    }
    seenCombinations.add(comboKey);

    // Validation
    if (variant.price < 0) {
      return next(new Error(`Negative price for SKU ${variant.sku}`));
    }

    if (calculateVariantStock(variant) < 0) {
      return next(new Error(`Negative stock for SKU ${variant.sku}`));
    }
  }

  next();
});

ProductSchema.virtual("min_price").get(function () {
  if (!this.has_variants) return this.selling_price;
  return Math.min(...this.variants.map((v) => v.price));
});

ProductSchema.virtual("max_price").get(function () {
  if (!this.has_variants) return this.selling_price;
  return Math.max(...this.variants.map((v) => v.price));
});

ProductSchema.virtual("total_stock").get(function () {
  if (!this.has_variants) return this.quantity_in_stock;
  return calculateTotalStock(this.variants);
});

// ====================== MODEL ===================== //
export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);

/* import mongoose, { Document, Schema } from "mongoose";

export enum ProductSize {
  STANDARD = "STANDARD",
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  EXTRA_LARGE = "EXTRA_LARGE",
}

export enum ProductStatus {
  active = "active",
  inactive = "inactive",
}

export enum Unit {
  pcs = "pcs",
  ml = "ml",
  ltr = "ltr",
  g = "g",
  kg = "kg",
  pack = "pack",
  box = "box",
}

export interface IProductImage extends Document {
  image_url: string;
  is_primary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    image_url: {
      type: String,
      required: true,
    },
    is_primary: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ProductImageSchema.index({ is_primary: 1 });

export interface IVariantAttribute {
  key: string;
  value: string;
}

export interface IProductVariant extends Document {
  sku: string;
  attributes: IVariantAttribute[];
  price: number;
  stock: number;
  image_url?: string;
  status: "active" | "inactive";
}

export interface IVariationOption {
  name: string;
  values: string[];
}

const VariantSchema = new Schema<IProductVariant>({
  sku: { type: String, required: true },
  attributes: [
    {
      key: { type: String, required: true },
      value: { type: String, required: true },
    },
  ],
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  image_url: String,
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
});

const VariationOptionSchema = new Schema<IVariationOption>({
  name: { type: String, required: true },
  values: [{ type: String, required: true }],
});

export interface IProduct extends Document {
  product_id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  unit: Unit;
  size: ProductSize;
  status: ProductStatus;
  category_id?: string;
  brand_id?: string;
  images: IProductImage[];

  has_variants: boolean;
  variants: IProductVariant[];
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
        `prd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: String,
    cost_price: {
      type: Number,
      required: true,
      default: 0,
    },
    selling_price: {
      type: Number,
      required: true,
      default: 0,
    },
    quantity_in_stock: {
      type: Number,
      default: 0,
      index: true,
    },
    unit: {
      type: String,
      enum: Object.values(Unit),
      default: Unit.pcs,
    },
    size: {
      type: String,
      enum: Object.values(ProductSize),
      default: ProductSize.STANDARD,
    },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.active,
      index: true,
    },
    category_id: {
      type: String,
      index: true,
    },
    brand_id: {
      type: String,
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
      type: [VariantSchema],
      default: [],
    },
    variation_options: {
      type: [VariationOptionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "products",
  }
);

ProductSchema.index({ category_id: 1 });
ProductSchema.index({ brand_id: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ name: 1 });
ProductSchema.index({ quantity_in_stock: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ "variants.sku": 1 });
ProductSchema.index({ "variation_options.name": 1 });

// Composite Indexes for Filtering
ProductSchema.index({ status: 1, category_id: 1 });
ProductSchema.index({ status: 1, brand_id: 1 });

export const ProductModel = mongoose.model<IProduct>("Product", ProductSchema);
 */
