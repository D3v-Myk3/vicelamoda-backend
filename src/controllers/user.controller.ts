import { UserModel } from "../models/mongoose/User.model";
import { CustomRequest, CustomResponse } from "../types/general.types";

export const updateProfileController = async (
  req: CustomRequest,
  res: CustomResponse
): Promise<void> => {
  try {
    // Middleware attaches user to req.user with { user_id, role } or similar
    // Check userAuthMiddleware or similar to confirm property structure.
    // Assuming (req as any).user.user_id based on typical JWT payload
    const userPayload = (req as any).user;
    const id = userPayload?.user_id || userPayload?.id;

    if (!id) {
      res.status(401).json({
        data: null,
        message: "Unauthorized: User ID not found",
      });
      return;
    }

    const { fullname, phone } = req.body as {
      fullname?: string;
      phone?: string;
    };

    const updateData: any = {};
    if (fullname) updateData.fullname = fullname;
    if (phone) updateData.phone = phone;

    const updatedUser = await UserModel.findOneAndUpdate(
      { user_id: id }, // Assuming user_id is the lookup field
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updatedUser) {
      res.status(404).json({
        data: null,
        message: "User not found",
      });
      return;
    }

    const { password, ...safeUser } = updatedUser as any;

    res.status(200).json({
      data: safeUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      data: null,
      message: "Failed to update profile",
    });
  }
};
