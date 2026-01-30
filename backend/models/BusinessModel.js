import mongoose from "mongoose";

const businessProfileSchema = mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    businessName: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    PhoneNumber: {
      type: String,
      default: "",
    },
    gst: {
      type: String,
      default: "",
    },

    logoUrl: {
      type: String,
    },
    stampUrl: {
      type: String,
    },
    signatureUrl: {
      type: String,
    },
    signatureOwnerName: {
      type: String,
    },
    signatureOwnerTitle: {
      type: String,
    },
    defaulttaxPercent: {
      type: Number,
      default: 18,
    },
  },
  {
    timestamps: true,
  },
);

const BusinessProfile = mongoose.model(
  "BusinessProfile",
  businessProfileSchema,
);

export default BusinessProfile;
