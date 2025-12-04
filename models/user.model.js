import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
    },
    age: {           
      type: Number,
    },
    phoneNumber: {
      type: String,
    },
    address:{
      type: String,
    },
    email: {
      type: String,
      lowercase: true
    },
    gender: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    bloodGroup: {
      type: String,
    },
    password: {
      type: String,
    },
    isNewUser: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const User =mongoose.models.User || mongoose.model("User", userSchema) ;
export default User;
