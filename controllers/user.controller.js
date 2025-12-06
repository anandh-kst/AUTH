import bcrypt from "bcrypt";
import { profileValidation } from "../utils/validators/user.validator.js";
import Otp from "../models/otp.model.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import jwt from "jsonwebtoken";
import {
  generateOtp,
  otpTemplate,
  transporter,
  welcomeEmailTemplate,
} from "../utils/mailer-helper.js";
import { calculateProfileScore, isValid } from "../utils/profile-helper.js";
import Identity from "../models/identity.model.js";
import Profile from "../models/profile.model.js";

export default {
  register: async (req, res) => {
    try {
      const { userToken, ...body } = req.body;
      const { error, value } = profileValidation.validate(body, {
        abortEarly: false,
        errors: { wrap: { label: "" } },
      });
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
        "profileScore",
        "identityId",
      ];
      BLOCKED_FIELDS.forEach((field) => delete updateData[field]);
      if (req.file) {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "users" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
        });
        updateData.profileImage = result.secure_url;
      }

      if (isValid(userToken)) {
        const { id } = jwt.verify(userToken, process.env.JWT_SECRET);

        const identityUser = await Identity.findById(id);
        if (!identityUser) {
          return res.status(404).json({
            success: "error",
            message: "Invalid user token",
          });
        }
        if (updateData.email) delete updateData.email;
        await identityUser.save();

        let userProfile = await Profile.findOne({ identityId: id });
        if (!userProfile) {
          userProfile = new Profile({ identityId: id });
        }
        const allowedFields = [
          "firstName",
          "lastName",
          "email",
          "age",
          "dob",
          "gender",
          "phoneNumber",
          "address1",
          "address2",
          "city",
          "state",
          "pincode",
          "bloodGroup",
          "profileImage",
          "pan",
          "adhaar",
        ];

        Object.keys(updateData).forEach((key) => {
          if (!allowedFields.includes(key)) {
            delete updateData[key];
          }
        });
        Object.assign(userProfile, updateData);
        userProfile.lastModifiedBy = identityUser.email;
        userProfile.profileScore = calculateProfileScore(userProfile);
        await userProfile.save();

        return res.status(200).json({
          success: "success",
          message: "User updated successfully",
        });
      }
      if (!updateData.email || !updateData.password) {
        return res.status(400).json({
          success: "error",
          message: "Email and password are required",
        });
      }
      let exists = await Identity.findOne({ email: updateData.email });
      if (exists) {
        return res.status(400).json({
          success: "error",
          message: "This email already exists",
        });
      }
      const identityData = {
        email: updateData.email,
        password: await bcrypt.hash(updateData.password, 10),
        createdBy: updateData.email,
        lastModifiedBy: updateData.email,
      };

      const identity = await Identity.create(identityData);
      const userProfile = await Profile.create({
        identityId: identity._id,
        createdBy: updateData.email,
        lastModifiedBy: updateData.email,
        ...updateData,
        profileScore: calculateProfileScore(updateData),
      });
      if (!userProfile)
        return res
          .status(500)
          .json({ success: "error", message: "User not created" });

      await transporter.sendMail({
        from: `"Health App" <${process.env.MAIL_USER}>`,
        to: updateData.email,
        subject: "Welcome to Health APP",
        html: welcomeEmailTemplate(`${userProfile.email}`),
      });

      const token = jwt.sign({ id: identity._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      return res.status(201).json({
        success: "success",
        message: "User created successfully",
        data: { userToken: token },
      });
    } catch (err) {
      console.error("Save/Update error:", err);

      if (err.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ success: "error", message: "Invalid token" });
      }
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ success: "error", message: "Token expired" });
      }

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

      const user = await Identity.findOne({ email });
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
      const { error, value } = profileValidation.validate({ email, password });
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Invalid credentials",
        });
      }
      const validatedData = { ...value };
      const user = await Identity.findOne({ email: validatedData.email });
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
        data: { userToken: token },
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
      console.log(decoded);
      const user = await Profile.findOne({ identityId: decoded.id });
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
