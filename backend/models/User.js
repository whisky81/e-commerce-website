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
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [100, "Full name must not exceed 100 characters"]
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (value) {
          return /^(?:\+84|84|0)(3|5|7|8|9)\d{8}$/.test(value);
        },
        message: "Invalid Vietnamese phone number"
      }
    },
    street: {
      type: String,
      required: [true, "Street is required"],
      trim: true,
      maxlength: [255, "Street must not exceed 255 characters"]
    },
    ward: {
      type: String,
      required: [true, "Ward is required"],
      trim: true
    },
    province: {
      type: String,
      required: [true, "Province is required"],
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    lat: {
      type: Number,
      default: null,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      default: null,
      min: -180,
      max: 180
    },
    placeId: {
      type: String,
      default: null,
      trim: true
    },
    district: {
      type: String,
      default: null
    }
  },
  {
    _id: true,
    timestamps: true
  }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },

    avatar: {
      url: {
        type: String,
        default: null
      },

      publicId: {
        type: String,
        default: null
      }
    },

    cart: [cartItemSchema],
    addresses: [addressSchema],

    role: { type: String, enum: ["user", "admin"], default: "user" },

    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },

    // Email verification
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true, minimize: false }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
