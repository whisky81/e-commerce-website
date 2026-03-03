import User from "../../models/v2/User.js"
import validator from "validator"

export const profile = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                addresses: req.user.addresses
            }
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email } = req.body;

        if (
            (!name && !email) ||
            (name === req.user.name && email === req.user.email)
        ) {
            return res.status(400).json({
                success: false,
                message: "Nothing to update"
            });
        }

        if (email && !validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // check email trùng
        if (email) {
            const exist = await User.findOne({ email, _id: { $ne: userId } });
            if (exist) {
                return res.status(400).json({
                    success: false,
                    message: "Email already in use"
                });
            }
        }

        const user = req.user;
        if (name && name.trim() !== "") user.name = name;
        if (email && email.trim() !== "") user.email = email;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
}

export const addAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, phone, street, ward, district, province, isDefault } = req.body;

        if (!fullName || !phone || !street || !ward || !district || !province) {
            return res.status(400).json({
                success: false,
                message: "Missing address fields"
            });
        }

        const user = await User.findById(userId);

        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        const newAddress = {
            fullName,
            phone,
            street,
            ward,
            district,
            province,
            isDefault: isDefault || false
        };

        user.addresses.push(newAddress);
        await user.save();

        const createdAddress = user.addresses[user.addresses.length - 1];

        return res.status(201).json({
            success: true,
            message: "Address added",
            data: createdAddress
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

export const updateAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const { fullName, phone, street, ward, district, province, isDefault } = req.body;

        // const user = await User.findById(userId);
        const user = req.user;

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        // nếu set default mới → bỏ default cũ
        if (isDefault === true) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        if (fullName !== undefined) address.fullName = fullName;
        if (phone !== undefined) address.phone = phone;
        if (street !== undefined) address.street = street;
        if (ward !== undefined) address.ward = ward;
        if (district !== undefined) address.district = district;
        if (province !== undefined) address.province = province;
        if (isDefault !== undefined) address.isDefault = isDefault;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address updated"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const user = req.user;

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        user.addresses.pull(addressId);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Address deleted"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};