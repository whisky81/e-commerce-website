import User from "../../models/v2/User.js";

export const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        if (quantity < 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid quantity"
            })
        }
        const user = req.user;

        const existingCartItemIndex = user.cart.findIndex(
            item => item.product.toString() === productId
        );

        

        if (existingCartItemIndex !== -1) {
            if (quantity === 0) {
                user.cart.splice(existingCartItemIndex, 1);
            } else {
                user.cart[existingCartItemIndex].quantity = quantity;
            }
        } else {
            quantity > 0 && (user.cart.push({
                product: productId,
                quantity
            }));
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: quantity === 0 ? "Product removed from cart" : "Cart updated successfully",
            cart: user.cart
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const removeCartItem = async (req, res) => {
    try {
        const user = req.user; // đã được set từ protect
        const { productId } = req.params;

        // tìm item trong cart
        const cartItem = user.cart.find(
            item => item.product.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Item not found in cart"
            });
        }

        // xóa bằng pull
        user.cart.pull({ product: productId });
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Item removed from cart"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const userCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate("cart.product", "name price images");
        console.log(user);
        return res.status(200).json({
            success: true,
            data: user.cart.map(item => ({
                product: {
                    _id: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    images: item.product.images
                },
                quantity: item.quantity
            }))
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}