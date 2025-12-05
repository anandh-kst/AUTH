import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { userValidation } from "../utils/validators/user.validator.js";
import Otp from "../models/otp.model.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import jwt from "jsonwebtoken";

import {
  generateOtp,
  otpTemplate,
  transporter,
} from "../utils/mailer-helper.js";
import { calculateProfileScore } from "../utils/profile-helper.js";

export default {
  register: async (req, res) => {
    try {
      const { userId, ...body } = req.body;
      const { error, value } = userValidation.validate(body);
      if (error) {
        return res.status(400).json({
          success: "error",
          message: error.details[0].message,
        });
      }
      let updateData = { ...value };
      const BLOCKED_FIELDS = [
        "_id",
        "createdAt",
        "updatedAt",
        "profileImage",
        "profileScore",
      ];
      BLOCKED_FIELDS.forEach((field) => delete updateData[field]);
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const upload_stream = cloudinary.uploader.upload_stream(
            { folder: "users" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(upload_stream);
        });

        updateData.profileImage = result.secure_url;
      }
      const profileScore = calculateProfileScore(updateData);
      updateData.profileScore = profileScore;

      let user;
      if (userId) {
        user = await User.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
          return res.status(404).json({
            success: "error",
            message: "User not found",
          });
        }

        return res.status(200).json({
          success: "success",
          message: "User updated successfully",
          data: user,
        });
      }

      if (updateData.email) {
        const isUserExits = await User.findOne({ email: updateData.email });
        if (isUserExits) {
          return res.status(400).json({
            success: "error",
            message: "This email already Registered",
          });
        }
      }
      user = await User.create(updateData);

      return res.status(201).json({
        success: "success",
        message: "User created successfully",
        data: user,
      });
    } catch (err) {
      console.error("Save/Update error:", err);
      return res.status(500).json({
        success: "error",
        message: "Internal server error",
      });
    }
  },
  sendOtp: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email)
        return res
          .status(400)
          .json({ status: "error", message: "Email is required" });

      const user = await User.findOne({ email });
      if (user)
        return res
          .status(404)
          .json({ status: "error", message: "This email already registered" });

      const otp = generateOtp();
      await Otp.create({
        email: email,
        otp: otp,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      const mailOptions = {
        from: `"Health App" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Your OTP Verification Code",
        html: otpTemplate(otp),
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        message: "OTP sent successfully",
        status: "success",
      });
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({
        message: "Failed to send OTP",
        error: error.message,
      });
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res
          .status(400)
          .json({ status: "error", message: "Email and OTP are required" });
      const record = await Otp.findOne({ email }).sort({ createdAt: -1 });
      if (!record)
        return res
          .status(400)
          .json({ status: "error", message: "No OTP found" });
      if (record.otp !== otp)
        return res
          .status(400)
          .json({ status: "error", message: "Invalid OTP" });
      if (record.verified)
        return res
          .status(400)
          .json({ status: "error", message: "OTP already used" });
      if (record.expires_at < new Date())
        return res
          .status(400)
          .json({ status: "error", message: "OTP expired" });
      record.verified = true;
      await record.save();

      return res
        .status(200)
        .json({ status: "success", message: "OTP verified successfully" });
    } catch (error) {
      console.error("OTP verification error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Something went wrong" });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({
          status: "error",
          message: "Email and password are required",
        });
      const { error, value } = userValidation.validate({ email, password });
      if (error) {
        return res.status(400).json({
          status: "error",
          message: error.details[0].message,
        });
      }
      const validatedData = { ...value };
      const user = await User.findOne({ email: validatedData.email });
      if (!user)
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
      if (!user.password) {
        return res
          .status(400)
          .json({ status: "error", message: "Registration not completed" });
      }
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.password
      );
      if (!isPasswordValid)
        return res
          .status(400)
          .json({ status: "error", message: "Invalid password" });

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      return res.status(200).json({
        status: "success",
        message: "Login successful",
        data: { token },
      });
    } catch (error) {
      console.error("Login error:", error);
      res
        .status(500)
        .json({ status: "error", message: "Something went wrong" });
    }
  },
  getUser: async (req, res) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });
      }
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ status: "error", message: "User not found" });
      }
      return res.status(200).json({ status: "success", data: user });
    } catch (error) {
      console.error("Error getting user:", error);
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      return res
        .status(500)
        .json({ status: "error", message: "Something went wrong" });
    }
  },
};
