import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { updateUserValidation } from "../utils/validators/user.validator.js";
import Otp from "../models/otp.model.js";
import {
  generateOtp,
  otpTemplate,
  transporter,
} from "../utils/mailer-helper.js";

export default {
  register: async (req, res) => {
    try {
      const { userId, ...body } = req.body;
      const { error, value } = updateUserValidation.validate(body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }
      let updateData = { ...value };
      const BLOCKED_FIELDS = ["_id", "createdAt", "updatedAt"];
      BLOCKED_FIELDS.forEach((field) => delete updateData[field]);
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      let user;
      if (userId) {
        user = await User.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        return res.status(200).json({
          success: true,
          message: "User updated successfully",
          data: user,
        });
      }

      user = await User.insertOne(updateData);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (err) {
      console.error("Save/Update error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
  sendOtp: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) return res.status(400).json({ message: "Email is required" });

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
};
