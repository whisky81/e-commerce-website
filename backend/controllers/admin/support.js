import SupportMessage from "../../models/SupportMessage.js";
import ApiResponse from "../../utils/ApiResponse.js";
import NotFoundError from "../../errors/NotFoundError.js";
import AppError from "../../errors/AppError.js";

export const getSupportMessages = async (req, res) => {
    const messages = await SupportMessage.find()
        .populate("user", "name email")
        .populate("order", "code status fee")
        .sort({ createdAt: -1 });

    ApiResponse.success("Success", messages).send(res);
};

export const replyToSupportMessage = async (req, res) => {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply?.trim()) {
        throw new AppError("Reply message cannot be empty", 400);
    }

    const message = await SupportMessage.findById(id);
    if (!message) throw new NotFoundError("SupportMessage");

    message.reply = reply.trim();
    message.status = "resolved";
    await message.save();

    ApiResponse.success("Replied successfully", message).send(res);
};
