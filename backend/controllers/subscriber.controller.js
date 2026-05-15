import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";
import AppError from "../errors/AppError.js";
import validator from "validator";
import ApiResponse from "../utils/ApiResponse.js";
export const unsubscribe = async (req, res) => {
    const email = req.user.email;
    if (!email || !validator.isEmail(email))
        throw new AppError("Invalid email", 400, "INVALID_EMAIL");
    const subscriber = await Subscriber.findOneAndUpdate(
        { email, isActive: true },
        { $set: { isActive: false } },
        { new: true }
    );
    if (!subscriber)
        throw new AppError("Subscriber not found or already unsubscribed", 404, "NOT_FOUND");
    ApiResponse.success("Unsubscribed successfully").send(res);
};
export const register = async (req, res) => {
    let { email, name } = req.body;
    if (!email?.trim() || !validator.isEmail(email))
        throw new AppError("Invalid email", 400, "INVALID_EMAIL");
    const [subscriber, existingUser] = await Promise.all([
        Subscriber.findOne({ email }),
        User.findOne({ email })
    ]);
    if (subscriber) {
        subscriber.name = name?.trim() || existingUser?.name || subscriber.name;
        subscriber.isActive = true;
        if (subscriber.user?.toString() !== existingUser?._id?.toString()) {
            subscriber.user = existingUser?._id;
        }
        await subscriber.save()
    } else {
        name = existingUser?.name || name?.trim() || "";
        await Subscriber.create({
            email, name, user: existingUser?._id ?? null
        });
    }
    ApiResponse.success("success").send(res);
}