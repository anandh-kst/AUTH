import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    identityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Identity",
    },
    email: {
      type: String,
      lowercase: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    age: { type: Number },
    dob: { type: Date },
    gender: { type: String, trim: true },
    phoneNumber: {
      type: String,
    },
    profileImage: {
      type: String,
      default:
        "https://img.freepik.com/premium-vector/user-profile-icon-circle_1256048-12499.jpg?semt=ais_hybrid&w=740&q=80",
    },
    bloodGroup: {
      type: String,
    },
    profileScore: {
      type: Number,
      default: 0,
    },
    adhaar: { type: String, trim: true },
    pan: { type: String, trim: true },
    address1: { type: String, trim: true },
    address2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: Number },
    isNewUser: { type: Boolean, default: true },
    createdBy: { type: String, default: null },
    lastModifiedBy: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const Profile =
  mongoose.models.UserProfile || mongoose.model("Profile", profileSchema);

export default Profile;
