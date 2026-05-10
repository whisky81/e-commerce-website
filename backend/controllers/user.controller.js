import User from "../models/User.js"
import Product from "../models/Product.js"
import { v2 as cloudinary } from "cloudinary"
import validator from "validator"
import mongoose from "mongoose"
import ApiResponse from "../utils/ApiResponse.js";
import AppError from "../errors/AppError.js";
import ValidationError from "../errors/ValidationError.js";
import NotFoundError from "../errors/NotFoundError.js";
import { delImage } from "../config/cloudinary.js";

export const profile = async (req, res) => {
  const user = {
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar || null,
    addresses: req.user.addresses,
    favorites: req.user.favorites || [],
    isEmailVerified: req.user.isEmailVerified,
    cart: req.user.cart,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt
  };
  ApiResponse.success('Success', user).send(res);

};

export const updateProfile = async (req, res) => {
  const userId = req.user._id;
  const { name, email } = req.body;

  // Normalize inputs first
  const newName = name?.trim() || null;
  const newEmail = email?.trim() || null;

  // Validate email format only if email was actually provided
  if (newEmail && !validator.isEmail(newEmail))
    throw new ValidationError("Invalid email format");

  // Check nothing to update — compare only what was provided
  const nameUnchanged = !newName || newName === req.user.name;
  const emailUnchanged = !newEmail || newEmail === req.user.email;
  if (nameUnchanged && emailUnchanged)
    throw new AppError("Nothing to update", 400, "NOTHING_TO_UPDATE");

  // Fix: only run duplicate check if email was actually provided AND changed
  if (newEmail && newEmail !== req.user.email) {
    const exist = await User.findOne({ email: newEmail, _id: { $ne: userId } });
    if (exist) throw new AppError("Email already in use", 400, "DUPLICATE_EMAIL");
  }

  const user = req.user;
  if (newName) user.name = newName;
  if (newEmail) user.email = newEmail;
  await user.save();
  const response = {
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    favorites: user.favorites,
    cart: user.cart,
    addresses: user.addresses,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    avatar: user.avatar
  }

  ApiResponse.success("Profile updated", response).send(res);
};

export const uploadAvatar = async (req, res) => {
  const file = req.files?.avatar?.[0];
  if (!file) throw new NotFoundError("Please upload an image file.");

  const currAvatar = req.user.avatar;
  if (currAvatar?.publicId) {
    const ok = await delImage(currAvatar.publicId);
    if (!ok) throw new AppError("can not delete previous avatar", 500, "SERVER_ERROR");
  }

  const result = await cloudinary.uploader.upload(file.path, {
    resource_type: "image",
    folder: "avatars",
    transformation: [
      { width: 200, height: 200, crop: "fill", gravity: "face" },
      { quality: "auto", fetch_format: "auto" }
    ],
  });

  await User.findByIdAndUpdate(req.user._id, {
    avatar: {
      url: result.secure_url,
      publicId: result.public_id
    }
  });

  new ApiResponse(true, 200, "Updated successfully", {
    url: result.secure_url,
    publicId: result.public_id
  }, null).send(res);
};

export const addAddress = async (req, res) => {
  const {
    fullName, phone,
    street, ward, province,
    isDefault,
    lat, lng, placeId
  } = req.body;
  if (
    !fullName || !phone
    || !street || !ward || !province
  )
    throw new AppError("Missing address fields", 400, "MISSING_ADDRESS_FIELDS");
  const user = req.user;
  if (isDefault) user.addresses.forEach(addr => addr.isDefault = false);
  user.addresses.push({
    fullName, phone, street, province, ward,
    isDefault: isDefault || false,
    lat: lat || null, lng: lng || null, placeId: placeId || null
  });
  await user.save();
  ApiResponse
    .created(user.addresses[user.addresses.length - 1], "Address added successfully")
    .send(res);
};

export const updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const {
    fullName, phone,
    street, ward, province,
    isDefault,
    lat, lng, placeId
  } = req.body;
  if (
    !fullName || !phone
    || !street || !ward || !province
  )
    throw new AppError("Missing address fields", 400, "MISSING_ADDRESS_FIELDS");
  const updatedAddress = await User.findOneAndUpdate(
    {
      _id: req.user._id,
      "addresses._id": addressId
    },

    {
      $set: {
        "addresses.$.fullName": fullName,
        "addresses.$.phone": phone,
        "addresses.$.province": province,
        "addresses.$.street": street,
        "addresses.$.ward": ward,
        "addresses.$.isDefault": isDefault,
        "addresses.$.lat": lat,
        "addresses.$.lng": lng,
        "addresses.$.placeId": placeId
      }
    },

    {
      new: true,
      runValidators: true
    }
  ).select("addresses").lean();
  ApiResponse
    .success("Address updated successfully", updatedAddress)
    .send(res);
};

export const bulkDeleteAddresses = async (req, res) => {
  const { bulk } = req.body;
  if (
    !bulk ||
    !Array.isArray(bulk) ||
    bulk.length === 0
  ) {
    throw new AppError(
      "Please provide an array of address ids",
      400,
      "BAD_REQUEST"
    );
  }
  const validIds = bulk.every(id =>
    mongoose.Types.ObjectId.isValid(id)
  );
  if (!validIds) {
    throw new ValidationError("Invalid address ids");
  }
  const existingAddresses = req.user.addresses.filter(
    address => bulk.includes(address._id.toString())
  );
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        addresses: {
          _id: { $in: bulk }
        }
      }
    },
    {
      new: true
    }
  ).select("addresses");
  new ApiResponse(
    true,
    200,
    "Addresses deleted successfully",
    updatedUser.addresses,
    {
      deletedAddressesCount: existingAddresses.length
    }
  ).send(res);
};

export const listFavorites = async (req, res) => {
  const favorites = await User.findById(req.user._id)
    .select("favorites")
    .populate({
      path: "favorites",
      select: "_id name price images category brand stock soldCount discount saleStartAt saleEndAt"
    })
    .lean({ virtuals: true });
  ApiResponse.success("Success", favorites).send(res);
};

export const addFavorite = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ValidationError("Invalid product");
  if (!await Product.findById(productId))
    throw new NotFoundError("Product not found");
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { favorites: productId } });
  ApiResponse.success("Success").send(res);
};

export const removeFavorite = async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(productId))
    throw new ValidationError("Invalid product");
  if (!await Product.findById(productId))
    throw new NotFoundError("Product not found");
  await User
    .findByIdAndUpdate(req.user._id, { $pull: { favorites: productId } });
  ApiResponse.success("Success").send(res);
};
