import mongoose from "mongoose";

const identitySchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      default: null,
    },
    lastModifiedBy: {
      type: String,
      default: null,
    },
    identityVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps:true
  }
);

const Identity = mongoose.models.Identity ||mongoose.model("Identity", identitySchema);
export default Identity;
