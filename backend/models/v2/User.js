import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 }
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone:    { type: String, required: true, trim: true },
    street:   { type: String, required: true, trim: true },
    ward:     { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    // Google Maps
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    placeId: { type: String, default: null },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 8, select: false },

    cart:      [cartItemSchema],
    addresses: [addressSchema],

    role: { type: String, enum: ["user", "admin"], default: "user" },

    isActive:        { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    // Email verification
    emailVerificationToken:   { type: String,  select: false },
    emailVerificationExpires: { type: Date,    select: false },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true, minimize: false }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
