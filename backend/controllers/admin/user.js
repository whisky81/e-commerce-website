import User from "../../models/User.js";
import ValidationError from "../../errors/ValidationError.js";
import mongoose from "mongoose";
import ApiResponse from "../../utils/ApiResponse.js";
export const bulkDeactivateUsers = async (req, res) => {
    const { bulk } = req.body;
    if (
        !bulk ||
        !Array.isArray(bulk) ||
        bulk.length === 0 ||
        !bulk.every(id => mongoose.Types.ObjectId.isValid(id))) {
        throw new ValidationError("Invalid user ids");
    }
    const result = await User.updateMany(
        { _id: { $in: bulk } },
        { $set: { isActive: false } }
    );
    new ApiResponse(true, 200, 'Updated successfully', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
    }, null).send(res);
}

export const getUsersAdmin = async (req, res) => {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    new ApiResponse(true, 200, 'Success', users).send(res);
}

export const toggleUserActive = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ValidationError("Invalid user id");
    }
    const user = await User.findById(id);
    if (!user) {
        throw new ValidationError("User not found");
    }
    user.isActive = !user.isActive;
    await user.save();
    new ApiResponse(true, 200, 'User status updated', user).send(res);
}