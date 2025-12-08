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
      const { error, value } = profileValidation.validate(body);
      if (error) {
        return res.status(400).json({
          success: "error",
          message: error.details[0].message,
          code: "BAD_REQUEST",
          details: error.details,
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
            message: "User not found",
            code: "NOT_FOUND",
            details: null,
          });
        }
        let userProfile = await Profile.findOne({ identityId: id });
        if (!userProfile) {
          return res.status(404).json({
            success: "error",
            message: "Profile not found for this Identity",
            code: "NOT_FOUND",
            details: null,
          });
        }
        if (updateData.dob) {
          const today = new Date();
          const birthDate = new Date(updateData.dob);
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          updateData.age = age;
        }
        const allowedFields = [
          "firstName",
          "lastName",
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
          "pan",
          "adhaar",
        ];

        Object.keys(updateData).forEach((key) => {
          if (!allowedFields.includes(key)) {
            delete updateData[key];
          }
        });
        Object.assign(userProfile, updateData);
        userProfile.lastModifiedBy = userProfile.email;
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
          code: "FIELD_REQUIRED",
          details: {
            email: "Email is required",
            password: "Password is required",
          },
        });
      }
      const record = await Otp.findOne({ email: updateData.email }).sort({
        createdAt: -1,
      });

      if (!record || !record.verified) {
        return res.status(400).json({
          success: "error",
          message: "OTP Verification is required",
          code: "OTP_REQUIRED",
          details: null,
        });
      }
      let exists = await Identity.findOne({ email: updateData.email });
      if (exists) {
        return res.status(400).json({
          success: "error",
          message: "This email already exists",
          code: "ALREADY_EXISTS",
          details: null,
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
        return res.status(500).json({
          success: "error",
          message: "User not created",
          code: "NOT_CREATED",
          details: null,
        });

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
      return res.status(err.status || 500).json({
        success: "error",
        message: err.message || "Internal server error",
        code: err.code || err.name || "SERVER_ERROR",
        details: err.details || err,
      });
    }
  },
  sendOtp: async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({
          status: "error",
          message: "Body is required",
          code: "FIELD_REQUIRED",
          details: null,
        });
      }
      if (!req.body.email) {
        return res.status(400).json({
          status: "error",
          message: "Email is required",
          code: "FIELD_REQUIRED",
          details: {
            email: "Email is required",
          },
        });
      }
      let { email, isChangePassword = false } = req.body;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "error",
          message: "Please enter a valid email address",
          code: "INVALID_DATA",
          details: {
            email: "Please enter a valid email address",
          },
        });
      }

      if (isChangePassword) {
        const user = await Identity.findOne({ email });
        if (!user)
          return res.status(404).json({
            status: "error",
            message: "Email not registered",
            code: "NOT_FOUND",
            details: null,
          });
      } else {
        const user = await Identity.findOne({ email });
        if (user)
          return res.status(404).json({
            status: "error",
            message: "This email already registered",
            code: "ALREADY_EXISTS",
            details: null,
          });
      }
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
      return res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Failed to send OTP",
        code: error.code || error.name || "SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
  verifyOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res.status(400).json({
          status: "error",
          message: "Email and OTP are required",
          code: "FIELD_REQUIRED",
          details: {
            email: "Email is required",
            otp: "OTP is required",
          },
        });
      const record = await Otp.findOne({ email }).sort({ createdAt: -1 });
      if (!record)
        return res.status(400).json({
          status: "error",
          message: "No OTP found",
          code: "NOT_FOUND",
          details: null,
        });
      if (record.otp !== otp)
        return res.status(400).json({
          status: "error",
          message: "Invalid OTP",
          code: "INVALID_DATA",
          details: {
            otp: "Invalid OTP",
          },
        });
      if (record.verified)
        return res.status(400).json({
          status: "error",
          message: "OTP already used",
          code: "ALREADY_EXISTS",
          details: null,
        });
      if (record.expires_at < new Date())
        return res.status(400).json({
          status: "error",
          message: "OTP expired",
          code: "OTP_EXPIRED",
          details: null,
        });
      record.verified = true;
      await record.save();

      return res
        .status(200)
        .json({ status: "success", message: "OTP verified successfully" });
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Something went wrong",
        code: error.code || error.name || "SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return res.status(400).json({
          status: "error",
          message: "Email and password are required",
          code: "FIELD_REQUIRED",
          details: {
            email: "Email is required",
            password: "Password is required",
          },
        });
      const { error, value } = profileValidation.validate({ email, password });
      if (error) {
        return res.status(400).json({
          status: "error",
          message: "Invalid credentials",
          code: "INVALID_DATA",
          details: error.details,
        });
      }
      const validatedData = { ...value };
      const user = await Identity.findOne({ email: validatedData.email });
      if (!user)
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "NOT_FOUND",
          details: null,
        });
      if (!user.password) {
        return res.status(400).json({
          status: "error",
          message: "Registration not completed",
          code: "NOT_FOUND",
          details: null,
        });
      }
      const isPasswordValid = await bcrypt.compare(
        validatedData.password,
        user.password
      );
      if (!isPasswordValid)
        return res.status(400).json({
          status: "error",
          message: "Invalid password",
          code: "INVALID_DATA",
          details: null,
        });

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
      res.status(error.status || 500).json({
        status: "error",
        message: error.message || "Something went wrong",
        code: error.code || error.name || "SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      if (!req.body) {
        return res.status(400).json({
          success: "error",
          message: "Body is required",
          code: "FIELD_REQUIRED",
          details: {
            email: "Password is required",
          },
        });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: "error",
          message: "Email is required",
          code: "FIELD_REQUIRED",
          details: {
            email: "Email is required",
          },
        });
      }
      const userIdentity = await Identity.findOne({ email });
      if (!email) {
        return res.status(404).json({
          success: "error",
          message: "User not found",
          code: "NOT_FOUND",
          details: null,
        });
      }
      const record = await Otp.findOne({ email }).sort({ createdAt: -1 });
      if (!record || !record.verified) {
        return res.status(400).json({
          success: "error",
          message: "OTP Verification Required",
          code: "NOT_FOUND",
          details: null,
        });
      }
      const userUpdate = await Identity.findByIdAndUpdate(userIdentity._id, {
        password: await bcrypt.hash(req.body.password, 10),
      });
      if (!userUpdate)
        return res.status(404).json({
          success: "error",
          message: "User not found",
          code: "NOT_FOUND",
          details: null,
        });
      return res.status(200).json({
        success: "success",
        message: "Password updated successfully",
      });
    } catch (err) {
      console.log(err);
      res.status(err.status || 500).json({
        success: "error",
        message: err.message || "Internal server error",
        code: err.code || err.name || "SERVER_ERROR",
        details: err.details || err,
      });
    }
  },
  getUser: async (req, res) => {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
        return res.status(401).json({
          status: "error",
          message: "Unauthorized",
          code: "UNAUTHORIZED",
          details: null,
        });
      }
      console.log(decoded);
      const user = await Profile.findOne({ identityId: decoded.id });
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
          code: "NOT_FOUND",
          details: null,
        });
      }
      return res.status(200).json({ status: "success", data: user });
    } catch (error) {
      console.error("Error getting user:", error);
      return res.status(error.status || 500).json({
        status: "error",
        message: "Something went wrong",
        code: error.code || error.name || "SERVER_ERROR",
        details: error.details || error,
      });
    }
  },
};
