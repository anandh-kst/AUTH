import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

export const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); 
};
export const otpTemplate = (otp) => `
  <div style="font-family:Arial, sans-serif; padding:20px; background:#f5f7fa;">
    <div style="max-width:500px; margin:0 auto; background:#ffffff; padding:30px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
      <h2 style="color:#4a4a4a; text-align:center;"> Health App Verification Code</h2>
      <p style="font-size:16px; color:#555;">
        Use the following One-Time Password (OTP) to complete your verification.
      </p>

      <div style="text-align:center; margin:25px 0;">
        <span style="font-size:32px; letter-spacing:3px; font-weight:bold; color:#2d6cdf;">
          ${otp}
        </span>
      </div>

      <p style="color:#777; font-size:14px;">
        This OTP is valid for <strong>10 minutes</strong>.  
        Do not share this code with anyone.
      </p>

      <hr style="margin:25px 0; border:0; border-top:1px solid #eee;" />

      <p style="font-size:12px; color:#aaa; text-align:center;">
        If you did not request this, please ignore this email.
      </p>
    </div>
  </div>
`;

import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, 
  },
});
