import crypto from "crypto";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
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
export const welcomeEmailTemplate = (name) => {
  return `
  <div style="margin:0; padding:0; background:#0d1117; font-family: 'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellspacing="0" cellpadding="0" style="background:#111827; border-radius:16px; padding:40px; color:#ffffff;">
            
            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h1 style="margin:0; color:#60a5fa; font-size:28px; letter-spacing:1px;">
                  HEALTH APP
                </h1>
              </td>
            </tr>

    
            <tr>
              <td align="center" style="padding:10px 0 20px;">
                <h2 style="color:#ffffff; margin:0; font-size:26px;line-height:42px;">
                  Welcome aboard, ${name} ! 
                </h2>
                <p style="color:#9ca3af; font-size:15px; line-height:24px; margin-top:10px;">
                  You’ve just joined the future of intelligent healthcare — powered by AI, 
                  real-time wearable integrations, medical pathways, and unified health data.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 0;">
                <table width="100%">
                  <tr>
                    <td style="padding:12px; background:#1e293b; border-radius:10px;">
                      <p style="color:#93c5fd; margin:0; font-size:16px;"><strong>✔ Wearable Data Integration</strong></p>
                      <p style="color:#cbd5e1; margin:4px 0 0; font-size:14px;">
                        Sync health metrics from Garmin, Fitbit, Polar, Withings, and more.
                      </p>
                    </td>
                  </tr>
                  
                  <tr><td style="height:12px;"></td></tr>

                  <tr>
                    <td style="padding:12px; background:#1e293b; border-radius:10px;">
                      <p style="color:#93c5fd; margin:0; font-size:16px;"><strong>✔ EHR Integration</strong></p>
                      <p style="color:#cbd5e1; margin:4px 0 0; font-size:14px;">
                        Access consolidated medical and clinical data securely.
                      </p>
                    </td>
                  </tr>

                  <tr><td style="height:12px;"></td></tr>

                  <tr>
                    <td style="padding:12px; background:#1e293b; border-radius:10px;">
                      <p style="color:#93c5fd; margin:0; font-size:16px;"><strong>✔ Personalized AI Health Pathways</strong></p>
                      <p style="color:#cbd5e1; margin:4px 0 0; font-size:14px;">
                        Receive AI-driven insights, predictions, and health recommendations.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td align="center" style="padding:30px 0;">
                <a href="https://kstinfotech.com/"
                  style="
                    background:linear-gradient(135deg, #3b82f6, #06b6d4);
                    padding:14px 26px;
                    color:white;
                    text-decoration:none;
                    border-radius:8px;
                    font-size:16px;
                    display:inline-block;
                  ">
                  Start Your Health Journey 
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:20px;">
                <p style="color:#6b7280; font-size:12px;">
                  © ${new Date().getFullYear()} Health AI — Revolutionizing digital health.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `;
};



export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, 
  },
});
