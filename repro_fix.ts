import mongoose from "mongoose";
import { StoreModel } from "./src/models/mongoose/Store.model";
import { UserModel } from "./src/models/mongoose/User.model";
import { createStoreZodSchema } from "./src/schemas/store.zod.schemas";

async function test() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/vicelamoda"
  );

  console.log("--- Testing Zod Transform ---");
  const zodResult = createStoreZodSchema.safeParse({
    name: "Test Store",
    code: "TS1",
    manager_id: "",
  });
  console.log(
    "Zod Result manager_id:",
    zodResult.success ? zodResult.data.manager_id : "Failed"
  );

  console.log("\n--- Testing Model Setter ---");
  const store = new StoreModel({
    name: "Model Test Store",
    code: "MTS1",
    address: "Test Address",
    phone: "123456789",
    manager_id: "",
  });
  console.log("Model manager_id before save:", store.manager_id);

  // We don't necessarily need to save to see the setter work if it's a simple setter,
  // but Mongoose ObjectIds are tricky.

  console.log("\n--- Testing Populate with null ---");
  const tempStore = await StoreModel.create({
    name: "Populate Test Store",
    code: "PTS1",
    address: "Test Address",
    phone: "123456789",
    manager_id: null,
  });

  try {
    const populated = await StoreModel.findById(tempStore._id)
      .populate({
        path: "manager_id",
        model: UserModel,
      })
      .exec();
    console.log("Populate success with null!");
  } catch (err) {
    console.error("Populate failed with null:", (err as Error).message);
  } finally {
    await StoreModel.deleteOne({ _id: tempStore._id });
  }

  await mongoose.disconnect();
}

// test(); // Uncomment to run if environment is set up
