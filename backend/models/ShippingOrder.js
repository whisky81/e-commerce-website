import mongoose from "mongoose";

const shippingFeeSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
      default: 0,
      min: 0,
    },

    insurance: {
      type: Number,
      default: 0,
      min: 0,
    },

    mainService: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnFee: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const shippingOrderSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["ghn"],
      default: "ghn",
      required: true,
    },

    providerOrderCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    shippingStatus: {
      type: String,
      enum: [
        "pending",
        "ready_to_pick",
        "picking",
        "delivering",
        "delivered",
        "return",
        "returned",
        "cancelled",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    expectedDeliveryTime: {
      type: Date,
    },

    trackingUrl: {
      type: String,
      trim: true,
    },

    fee: shippingFeeSchema,

    rawProviderResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    lastSyncedAt: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

const ShippingOrder =
  mongoose.models.ShippingOrder ||
  mongoose.model("ShippingOrder", shippingOrderSchema);

export default ShippingOrder;