import User from "../models/User.js";
import ApiResponse from "../utils/ApiResponse.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
export const addToCart = async (req, res) => {
    let { productId, quantity = 0 } = req.body;
    if (
        !productId ||
        Number(quantity) <= 0) {
        throw new ValidationError("Invalid body");
    }
    quantity = Number(quantity);
    const user = req.user;
    const existingCartItemIndex = user.cart.findIndex(
        item => item.product.toString() === productId
    );
    if (existingCartItemIndex !== -1) {
        user.cart[existingCartItemIndex].quantity = quantity;
    } else {
        user.cart.push({
            product: productId,
            quantity
        });
    }

    await user.save();
    ApiResponse
        .success(
            "Cart updated successfully",
            user.cart
        )
        .send(res);
}

export const removeCartItem = async (req, res) => {
    const user = req.user; // đã được set từ protect
    const { productId } = req.params;

    // tìm item trong cart
    const cartItem = user.cart.find(
        item => item.product.toString() === productId
    );

    if (!cartItem) {
        throw new NotFoundError("Product not found");
    }

    // xóa bằng pull
    user.cart.pull({ product: productId });
    await user.save();
    new ApiResponse(true, 204).send(res);
}

export const userCart = async (req, res) => {
    const data = await User.findById(req.user._id)
        .select("cart")
        .populate("cart.product", "name price images discount saleStartAt saleEndAt")
        .lean({ virtuals: true });
    ApiResponse.success("Success", data.cart).send(res);
}