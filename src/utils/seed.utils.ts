import fs from "fs";
import path from "path";
import {
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_PASSWORD,
  USER_EMAIL,
  USER_NAME,
  USER_PASSWORD,
} from "../configs/env.configs";
import { logger } from "../configs/logger.configs";
import { generateSKU } from "../helpers/sku.helpers";
import { BrandModel } from "../models/mongoose/Brand.model";
import { CategoryModel } from "../models/mongoose/Category.model";
import {
  FulfillmentStatus,
  OrderModel,
  PaymentMethod,
  PaymentStatus,
} from "../models/mongoose/Order.model";
import { ProductModel } from "../models/mongoose/Product.model";
import { StoreModel } from "../models/mongoose/Store.model";
import { SupplyModel } from "../models/mongoose/Supply.model";
import { UserModel, UserRole } from "../models/mongoose/User.model";
import { argon2HashPassword } from "./hash.utils";

const jsonDir = path.join(__dirname, "..", "json");

/* -------------------------------------------------------------------------- */
/*                                 User Seeds                                 */
/* -------------------------------------------------------------------------- */

export const seedAdmin = async () => {
  const source = "SEED SUPER ADMIN UTIL FUNC";

  // try {
  const existingSuperAdmin = await UserModel.findOne({
    role: UserRole.ADMIN,
  });

  if (existingSuperAdmin) {
    logger.info("Super admin already exists", { source });
  } else {
    const emailTaken = await UserModel.findOne({ email: ADMIN_EMAIL });
    if (emailTaken) {
      logger.warn("Email already used by another account", {
        source,
        email: ADMIN_EMAIL,
      });
    } else {
      const hashedAdminPassword = await argon2HashPassword(ADMIN_PASSWORD);
      await UserModel.create({
        fullname: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedAdminPassword,
        role: UserRole.ADMIN,
      });
      logger.info("Super admin seeded successfully", { source });
    }
  }

  const existingUser = await UserModel.findOne({ email: USER_EMAIL });
  if (!existingUser) {
    const hashedUserPassword = await argon2HashPassword(USER_PASSWORD);
    await UserModel.create({
      fullname: USER_NAME,
      email: USER_EMAIL,
      password: hashedUserPassword,
      role: UserRole.CUSTOMER,
    });
    logger.info("Test customer seeded successfully", { source });
  }
  /* } catch (error) {
    logger.error("Error seeding admin/user", { source, error });
  } */
};

/* -------------------------------------------------------------------------- */
/*                                Store Seeds                                 */
/* -------------------------------------------------------------------------- */

export const seedManagerForStore = async (fileName = "seed.store.json") => {
  const source = "SEED STORE MANAGER FROM FILE";

  // try {
  const raw = fs.readFileSync(path.join(jsonDir, fileName), "utf-8");
  const data = JSON.parse(raw);
  const managerId: string | undefined = data.manager_id;

  if (!managerId) {
    logger.info(
      "No manager_id present in store seed; skipping manager creation",
      { source }
    );
    return;
  }

  const existing = await UserModel.findOne({ user_id: managerId });
  if (existing) {
    logger.info("Manager user already exists", {
      source,
      manager_id: managerId,
    });
    return;
  }

  const hashed = await argon2HashPassword(`Manager123`);
  const managerEmail = `manager@vicelamoda.com`;

  await UserModel.create({
    user_id: managerId,
    fullname: `Vicelamoda Store Manager`,
    email: managerEmail,
    password: hashed,
    role: UserRole.MANAGER,
  });

  logger.info("Manager user created for store", {
    source,
    manager_id: managerId,
    email: managerEmail,
  });
  /* } catch (error) {
    logger.error("Error seeding store manager", { source, error });
  } */
};

export const seedStoreFromFile = async (fileName = "seed.store.json") => {
  const source = "SEED STORE FROM FILE";

  // try {
  const raw = fs.readFileSync(path.join(jsonDir, fileName), "utf-8");
  const data = JSON.parse(raw);

  const existing = await StoreModel.findOne({ store_id: data.store_id });
  let storeDoc;
  if (existing) {
    logger.info("Store already exists", {
      source,
      store_id: data.store_id,
    });
    storeDoc = existing;
  } else {
    storeDoc = await StoreModel.create(data);
    logger.info("Store seeded from file", {
      source,
      store_id: data.store_id,
    });
  }

  // Update manager's store_id if manager exists
  if (data.manager_id && storeDoc) {
    const manager = await UserModel.findOne({ user_id: data.manager_id });
    if (manager) {
      manager.store = storeDoc._id as any; // Assign ObjectId
      await manager.save();
      logger.info("Manager linked to store", {
        source,
        manager_id: data.manager_id,
        store_id: data.store_id,
      });
    }
  }
  /* } catch (error) {
    logger.error("Error seeding store from file", { source, error });
  } */
};

/* -------------------------------------------------------------------------- */
/*                            Category & Brand Seeds                          */
/* -------------------------------------------------------------------------- */

export const seedCategoriesFromFile = async (
  fileName = "seed.categories.beauty.json"
) => {
  const source = "SEED CATEGORIES FROM FILE";

  // try {
  const raw = fs.readFileSync(path.join(jsonDir, fileName), "utf-8");
  const { categories } = JSON.parse(raw);

  // Mongoose insertMany with ordered: false continues on error (e.g. duplicates)
  // but check duplicates manually to be cleaner or just upsert logic.
  // Simplifying to loop upsert for safety with existing data.
  let count = 0;
  for (const cat of categories) {
    const exists = await CategoryModel.findOne({
      category_id: cat.category_id,
    });
    if (!exists) {
      await CategoryModel.create(cat);
      count++;
    }
  }

  logger.info("Categories seeded", { source, count });
  /* } catch (error) {
    logger.error("Error seeding categories", { source, error });
  } */
};

export const seedBrandsFromFile = async (fileName = "seed.brands.json") => {
  const source = "SEED BRANDS FROM FILE";

  // try {
  const raw = fs.readFileSync(path.join(jsonDir, fileName), "utf-8");
  const { brands } = JSON.parse(raw);

  let count = 0;
  for (const brand of brands) {
    const exists = await BrandModel.findOne({ brand_id: brand.brand_id });
    if (!exists) {
      await BrandModel.create(brand);
      count++;
    }
  }
  logger.info("Brands seeded", { source, count });
  /* } catch (error) {
    logger.error("Error seeding brands", { source, error });
  } */
};

/* -------------------------------------------------------------------------- */
/*                                Product Seeds                               */
/* -------------------------------------------------------------------------- */

export const seedProductsFromFile = async (
  fileName = "seed.products.beauty.json"
) => {
  const source = "SEED PRODUCTS FROM FILE";

  // try {
  const raw = fs.readFileSync(path.join(jsonDir, fileName), "utf-8");
  const { products } = JSON.parse(raw);

  const brands = await BrandModel.find();
  const categories = await CategoryModel.find();

  const brandMap = new Map(brands.map((b) => [b.brand_id, b]));
  const categoryMap = new Map(categories.map((c) => [c.category_id, c]));

  let count = 0;
  for (const prod of products) {
    const { id, images, sku, size_variation, store_stocks, ...rest } = prod;

    const existing = await ProductModel.findOne({
      product_id: rest.product_id,
    });
    if (existing) continue;

    const brandDoc = brandMap.get(rest.brand_id);
    const categoryDoc = categoryMap.get(rest.category_id);

    if (!brandDoc || !categoryDoc) {
      logger.warn("Skipping product: missing brand or category mapping", {
        source,
        product_id: rest.product_id,
      });
      continue;
    }

    const generatedSku = generateSKU(
      brandDoc.abbreviation,
      categoryDoc.abbreviation,
      size_variation || null
    );

    // Construct Mongoose Product object
    // Assuming ProductModel includes images and quantity in the main doc or variants
    // The Product model provided has 'images' array and 'quantity_in_stock'
    // We'll sum up store_stocks for initial quantity_in_stock if provided, or default to 10
    const initialQty =
      store_stocks?.reduce(
        (acc: number, s: any) => acc + (s.quantity || 0),
        0
      ) || 10;

    await ProductModel.create({
      ...rest,
      sku: generatedSku,
      quantity_in_stock: initialQty,
      brand_id: brandDoc._id, // ObjectId
      category_id: categoryDoc._id, // ObjectId
      images: images?.map((img: any) => ({
        image_url: img.image_url,
        is_primary: img.is_primary || false,
      })),
      // If there are variants, they should be processed here too
      // For this seed, assuming flat products or matching structure
    });
    count++;
  }

  logger.info("Products seeded", { source, count });
  /* } catch (error) {
    logger.error("Error seeding products", { source, error });
  } */
};

/* -------------------------------------------------------------------------- */
/*                              Supply Scenarios                              */
/* -------------------------------------------------------------------------- */

export const seedSupplies = async () => {
  const source = "SEED SUPPLIES";
  // try {
  const products = await ProductModel.find().limit(5);
  const store = await StoreModel.findOne();
  const admin = await UserModel.findOne({ role: UserRole.ADMIN });

  if (!products.length || !store || !admin) {
    logger.warn("Missing prerequisites for seeding supplies", { source });
    return;
  }

  const supplyScenarios = [
    { name: "Initial Stock", supplier: "Global Imports Co." },
    { name: "Weekly Restock", supplier: "FastTech Solutions" },
    { name: "Emergency Supply", supplier: "Local Distributors" },
    { name: "Seasonal Stock", supplier: "Season Best" },
    { name: "Promo Allocation", supplier: "Brand Direct" },
    { name: "Bulk Resupply", supplier: "Mega Warehouse" },
    { name: "Variant Restock", supplier: "Color World" },
    { name: "Return Replacement", supplier: "Returns Processing" },
    { name: "New Collection", supplier: "Fashion Forward" },
    { name: "Holiday Prep", supplier: "Holiday Goods" },
  ];

  let count = 0;
  for (const scenario of supplyScenarios) {
    // Pick random products for this supply
    const selectedProducts = products.filter(() => Math.random() > 0.5);
    if (selectedProducts.length === 0) selectedProducts.push(products[0]);

    const supplyItems = selectedProducts.map((p) => ({
      product_id: p.product_id,
      quantity: Math.floor(Math.random() * 50) + 10,
      variant_sku: p.has_variants ? p.variants[0]?.sku : undefined, // simplified
      variant_name: p.has_variants ? "Standard Variant" : undefined,
    }));

    await SupplyModel.create({
      supplier_name: scenario.supplier,
      supplier_contact: `contact@${scenario.supplier.replace(/\s/g, "").toLowerCase()}.com`,
      date_supplied: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ), // Random date last 30 days
      recorded_by: admin.user_id,
      store_id: store.store_id,
      products: supplyItems,
    });
    count++;
  }

  logger.info("Supplies seeded", { source, count });
  /* } catch (error) {
    logger.error("Error seeding supplies", { source, error });
  } */
};

/* -------------------------------------------------------------------------- */
/*                              Order Scenarios                               */
/* -------------------------------------------------------------------------- */

export const seedOrders = async () => {
  const source = "SEED ORDERS";
  // try {
  const products = await ProductModel.find().limit(5);
  const store = await StoreModel.findOne();
  const user = await UserModel.findOne({ role: UserRole.CUSTOMER });
  const admin = await UserModel.findOne({ role: UserRole.ADMIN }); // Use admin as user fallback if no customer

  const targetUser = user || admin;

  if (!products.length || !store || !targetUser) {
    logger.warn("Missing prerequisites for seeding orders", { source });
    return;
  }

  const orderScenarios = [
    {
      status: FulfillmentStatus.DELIVERED,
      payment: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
    },
    {
      status: FulfillmentStatus.PROCESSING,
      payment: PaymentStatus.COMPLETED,
      method: PaymentMethod.PAYMEO,
    },
    {
      status: FulfillmentStatus.PENDING,
      payment: PaymentStatus.PENDING,
      method: PaymentMethod.CASH_ON_DELIVERY,
    },
    {
      status: FulfillmentStatus.SHIPPED,
      payment: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
    },
    {
      status: FulfillmentStatus.CANCELLED,
      payment: PaymentStatus.FAILED,
      method: PaymentMethod.STRIPE,
    },
    {
      status: FulfillmentStatus.DELIVERED,
      payment: PaymentStatus.COMPLETED,
      method: PaymentMethod.CASH_ON_DELIVERY,
    },
    {
      status: FulfillmentStatus.PROCESSING,
      payment: PaymentStatus.PENDING,
      method: PaymentMethod.BANK_TRANSFER,
    },
    {
      status: FulfillmentStatus.PENDING,
      payment: PaymentStatus.PENDING,
      method: PaymentMethod.PAYMEO,
    },
    {
      status: FulfillmentStatus.SHIPPED,
      payment: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
    },
    {
      status: FulfillmentStatus.DELIVERED,
      payment: PaymentStatus.COMPLETED,
      method: PaymentMethod.STRIPE,
    },
  ];

  let count = 0;
  for (const scenario of orderScenarios) {
    const selectedProducts = products.filter(() => Math.random() > 0.6);
    if (selectedProducts.length === 0) selectedProducts.push(products[0]);

    let totalAmount = 0;
    const orderItems = selectedProducts.map((p) => {
      const qty = Math.floor(Math.random() * 3) + 1;
      const price = p.selling_price;
      const lineTotal = qty * price;
      totalAmount += lineTotal;
      return {
        product_id: p.product_id,
        quantity: qty,
        unit_price: price,
        line_total: lineTotal,
        variant_sku: p.has_variants ? p.variants[0]?.sku : undefined,
        variant_name: p.has_variants ? "Default" : undefined,
      };
    });

    await OrderModel.create({
      user_id: targetUser.user_id,
      user: targetUser._id, // Mongoose Ref
      shipping_address: {
        fullname: targetUser.fullname,
        email: targetUser.email,
        phone: "1234567890",
        address_line1: "123 Seed Street",
        city: "Seed City",
        state: "Seed State",
        postal_code: "12345",
        country: "Seedland",
      },
      items: orderItems,
      total_amount: totalAmount,
      payment_method: scenario.method,
      payment_status: scenario.payment,
      fulfillment_status: scenario.status,
      createdAt: new Date(
        Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000
      ), // Last 60 days
    });
    count++;
  }

  logger.info("Orders seeded", { source, count });
  /* } catch (error) {
    logger.error("Error seeding orders", { source, error });
  } */
};

/* -------------------------------------------------------------------------- */
/*                            Variant Use Cases                               */
/* -------------------------------------------------------------------------- */

export const seedVariedProducts = async () => {
  const source = "SEED VARIED PRODUCTS";
  // try {
  const brands = await BrandModel.find();
  const categories = await CategoryModel.find();

  if (!brands.length || !categories.length) {
    logger.warn("Missing brands or categories for varied products", { source });
    return;
  }

  const materials = ["Cotton", "Polyester", "Leather", "Denim", "Silk"];
  const colors = ["Red", "Blue", "Black", "White", "Green"];
  // const sizes = [UserRole.CUSTOMER, "S", "M", "L", "XL"]; // Assuming ProductSize enum or similar strings

  let count = 0;
  for (let i = 0; i < 25; i++) {
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    // Generate random variants
    const productVariants = [];
    const numVariants = Math.floor(Math.random() * 3) + 3;

    // Create a pool of all possible combinations to ensure uniqueness
    const combinations = [];
    const sizeOptions = ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"];

    for (const s of sizeOptions) {
      for (const c of colors) {
        for (const m of materials) {
          combinations.push({ size: s, color: c, material: m });
        }
      }
    }

    // Shuffle and pick
    for (let k = combinations.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [combinations[k], combinations[j]] = [combinations[j], combinations[k]];
    }

    const selectedCombos = combinations.slice(0, numVariants);

    for (let j = 0; j < selectedCombos.length; j++) {
      const { size, color, material } = selectedCombos[j];

      productVariants.push({
        sku: `VAR-${i}-${j}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        size: size,
        price: Math.random() * 50 + 20,
        attributes: [
          { key: "Color", value: color },
          { key: "Material", value: material },
        ],
        stocks: [
          {
            store_id: "cln2g31d4000008jz072lb09k",
            stock: Math.floor(Math.random() * 20) + 5,
          },
        ], // Using the known seeded store ID
        status: "active",
      });
    }

    const prodName = `${brand.name} ${category.name} Variant Collection ${i + 1}`;

    // Create the product
    await ProductModel.create({
      product_id: `prod_var_${Date.now()}_${i}`,
      name: prodName,
      sku: `SKU-VAR-${Date.now()}-${i}`,
      description: `A varied product collection featuring different options.`,
      brand_id: brand._id,
      category_id: category._id,
      has_variants: true,
      variants: productVariants,
      status: "active",
      images: [
        {
          image_url:
            "https://res.cloudinary.com/devm-cloud-server/image/upload/v1765761080/V-Jacket_h1xzi3.jpg", // Placeholder
          is_primary: true,
        },
      ],
    });
    count++;
  }
  logger.info("Varied products seeded", { source, count });
  /* } catch (error) {
     logger.error("Error seeding varied products", { source, error });
  } */
};

export const seedVariantSupplies = async () => {
  const source = "SEED VARIANT SUPPLIES";
  // try {
  // Find products that have variants
  const variedProducts = await ProductModel.find({ has_variants: true });
  const store = await StoreModel.findOne();
  const admin = await UserModel.findOne({ role: UserRole.ADMIN });

  if (!variedProducts.length || !store || !admin) {
    logger.warn("Missing prerequisites for seeding variant supplies", {
      source,
    });
    return;
  }

  const suppliers = [
    "Variant Supply Co.",
    "Custom Goods Ltd.",
    "Specialty Sourcing",
  ];

  let count = 0;
  for (let i = 0; i < 15; i++) {
    const product =
      variedProducts[Math.floor(Math.random() * variedProducts.length)];
    const variant =
      product.variants[Math.floor(Math.random() * product.variants.length)];

    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

    await SupplyModel.create({
      supplier_name: supplier,
      supplier_contact: `contact@${supplier.replace(/\s/g, "").toLowerCase()}.com`,
      date_supplied: new Date(
        Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
      ),
      recorded_by: admin.user_id,
      store_id: store.store_id,
      products: [
        {
          product_id: product.product_id,
          quantity: Math.floor(Math.random() * 20) + 5,
          variant_sku: variant.sku,
          variant_name: `${variant.size} / ${variant.attributes.map((a: any) => a.value).join(" ")}`,
          cost_price: (variant.price * 0.6).toFixed(2), // Estimate cost
        },
      ],
    });
    count++;
  }
  logger.info("Variant supplies seeded", { source, count });
  /* } catch (error) {
       logger.error("Error seeding variant supplies", { source, error });
    } */
};

export const seedVariantOrders = async () => {
  const source = "SEED VARIANT ORDERS";
  // try {
  const variedProducts = await ProductModel.find({ has_variants: true });
  const user = await UserModel.findOne({ role: UserRole.CUSTOMER });
  const admin = await UserModel.findOne({ role: UserRole.ADMIN });
  const targetUser = user || admin;

  if (!variedProducts.length || !targetUser) {
    logger.warn("Missing prerequisites for seeding variant orders", { source });
    return;
  }

  let count = 0;
  for (let i = 0; i < 15; i++) {
    // Create an order with 1-3 varied items
    const numItems = Math.floor(Math.random() * 3) + 1;
    const orderItems = [];
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const product =
        variedProducts[Math.floor(Math.random() * variedProducts.length)];
      const variant =
        product.variants[Math.floor(Math.random() * product.variants.length)];
      const qty = Math.floor(Math.random() * 2) + 1;

      const lineTotal = qty * variant.price;
      totalAmount += lineTotal;

      orderItems.push({
        product_id: product.product_id,
        quantity: qty,
        unit_price: variant.price,
        line_total: lineTotal,
        variant_sku: variant.sku,
        variant_name: `${variant.size} - ${variant.attributes.map((a: any) => a.value).join("/")}`,
      });
    }

    await OrderModel.create({
      user_id: targetUser.user_id,
      user: targetUser._id,
      shipping_address: {
        fullname: targetUser.fullname,
        email: targetUser.email,
        phone: "555-0199",
        address_line1: "456 Variation Lane",
        city: "Diversity City",
        state: "CA",
        postal_code: "90210",
        country: "USA",
      },
      items: orderItems,
      total_amount: totalAmount,
      payment_method: PaymentMethod.STRIPE,
      payment_status: PaymentStatus.COMPLETED,
      fulfillment_status: FulfillmentStatus.PROCESSING,
      createdAt: new Date(
        Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000
      ),
    });
    count++;
  }
  logger.info("Variant orders seeded", { source, count });
  /* } catch (error) {
       logger.error("Error seeding variant orders", { source, error });
    } */
};

export const seedAllShopData = async () => {
  const source = "SEED ALL SHOP DATA";
  // try {
  await seedManagerForStore();
  await seedStoreFromFile();
  await seedCategoriesFromFile();
  await seedBrandsFromFile();
  await seedProductsFromFile();

  // Check if we need to seed scenarios
  const supplyCount = await SupplyModel.countDocuments();
  if (supplyCount < 10) await seedSupplies();

  const orderCount = await OrderModel.countDocuments();
  if (orderCount < 10) await seedOrders();

  // Seed Variants
  await seedVariedProducts();
  await seedVariantSupplies();
  await seedVariantOrders();

  logger.info("All shop data seeded", { source });
  /* } catch (error) {
    logger.error("Error running all shop seeds", { source, error });
  } */
};
