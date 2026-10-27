/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { TLoginAuth, TUser } from "./auth.interface";
import AppError from "../../errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import { createToken } from "./auth.utils";
import { User } from "./auth.model";
import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/sendEmail";

const signup = async (payload: Partial<TUser>) => {
  // Checking if user already exists
  const isUserExistsByEmail = await User.findOne({ email: payload.email });
  const isUserExistsByPhoneNumber = await User.findOne({
    phoneNumber: payload.phoneNumber,
  });

  if (isUserExistsByEmail) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this email."
    );
  }
  if (isUserExistsByPhoneNumber) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User already exists with this phone number."
    );
  }

  // Creating the user
  const result = await User.create(payload);

  return result;
};

// Login
const loginUser = async (payload: TLoginAuth) => {
  // Check if user exists
  const user = await User.isUserExists(payload.email);

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No account found with this email address. Please sign up first."
    );
  }

  // Deleted account check
  if (user.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Your account has been deleted. Please contact our support team if you need assistance or call us at 09617785588"
    );
  }

  // Suspended account check
  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been deactivated. Please contact our support team for further assistance or call us at 09617785588"
    );
  }

  // Password validation
  const isPasswordMatched = await User.isPasswordMatched(
    payload.password,
    user.password
  );

  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Incorrect password. Please try again."
    );
  }

  // JWT Payload
  const jwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profilePicture: user.profilePicture || "",
  };

  // Tokens
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture || "",
    },
  };
};

const refreshToken = async (token: string) => {
  // Ensure token was sent
  if (!token) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      "You are not authorized to proceed!"
    );
  }

  // Verify token
  const decoded = jwt.verify(
    token,
    config.jwt_refresh_secret as string
  ) as JwtPayload;

  const { email } = decoded;

  // Check user exists
  const user = await User.isUserExists(email);

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Deleted account check
  if (user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User does not exists.");
  }

  // Suspended account check
  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account has been deactivated. Please contact our support team for further assistance or call us at 09617785588"
    );
  }

  // JWT payload
  const jwtPayload = {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    profilePicture: user.profilePicture || "",
  };

  // Issue new access token
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string
  );

  return {
    accessToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePicture: user.profilePicture || "",
    },
  };
};

const buildResetOtpEmail = (otp: string) => `
  <div style="font-family: Arial, sans-serif; background:#f9f9f9; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; padding:30px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      <h2 style="color:#D4AF37; text-align:center;">AlgoQuad</h2>
      <p style="font-size:16px; color:#333;">Hello,</p>
      <p style="font-size:15px; color:#555;">
        You requested a password reset. Please use the code below to reset your password.
        This OTP is valid for <strong>2 minutes</strong>.
      </p>
      <div style="text-align:center; margin:30px 0;">
        <p style="font-size:32px; letter-spacing:4px; font-weight:bold; color:#D4AF37;">${otp}</p>
      </div>
      <p style="font-size:14px; color:#777;">
        If you didn't request this, you can safely ignore this email.
      </p>
      <p style="font-size:15px; color:#333; margin-top:30px;">Best regards,</p>
      <p style="font-size:16px; font-weight:bold; color:#D4AF37;">The AlgoQuad Team</p>
    </div>
  </div>
`;

const forgetPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact support."
    );
  }

  // Generate OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.resetOtp = otp;
  user.resetOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
  await user.save();

  const subject = "Reset Your Password - AlgoQuad";
  const htmlBody = buildResetOtpEmail(otp);

  try {
    await sendEmail(user.email, subject, htmlBody);
  } catch (error) {
    console.error("❌ Failed to send reset OTP email:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send reset OTP. Please try again."
    );
  }

  return {};
};

const resendForgotPasswordOtp = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact support."
    );
  }

  // Generate New OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  user.resetOtp = otp;
  user.resetOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min
  await user.save();

  const subject = "Resend: Reset Your Password - AlgoQuad";
  const htmlBody = buildResetOtpEmail(otp);

  try {
    await sendEmail(user.email, subject, htmlBody);
  } catch (error) {
    console.error("❌ Failed to resend reset OTP email:", error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to resend reset OTP. Please try again."
    );
  }

  return {};
};

const verifyResetOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email });

  if (!user || user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (!user.resetOtp || user.resetOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  if (!user.resetOtpExpireAt || user.resetOtpExpireAt < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired");
  }

  user.isResetOtpVerified = true;
  user.resetOtp = null;
  user.resetOtpExpireAt = null;
  await user.save();

  return {};
};

const resetPassword = async (payload: {
  email: string;
  newPassword: string;
}) => {
  const { email, newPassword } = payload;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  if (user.isSuspended) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your account is suspended. Please contact support."
    );
  }

  if (!user.isResetOtpVerified) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "OTP not verified. Please verify OTP before resetting password."
    );
  }

  // IMPORTANT:
  // Assign plain password.
  // pre("save") middleware will hash it.
  user.password = newPassword;

  user.passwordChangedAt = new Date();
  user.isResetOtpVerified = false;

  user.resetOtp = null;
  user.resetOtpExpireAt = null;

  await user.save();

  return {
    success: true,
    message: "Password reset successfully",
  };
};

const changePassword = async (
  userId: string,
  payload: { currentPassword: string; newPassword: string }
) => {
  const user = await User.findById(userId).select("+password");

  // Checking if the user exists
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Check if the current password is correct
  const isPasswordMatched = await bcrypt.compare(
    payload.currentPassword,
    user.password
  );
  if (!isPasswordMatched) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Current password is incorrect!"
    );
  }

  // Hash the new password
  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_round)
  );
  await User.findByIdAndUpdate(userId, {
    password: newHashedPassword,
  });
};

// Change user role (For admin)
const changeUserRole = async (payload: { userId: string; role: any }) => {
  const user = await User.findById(payload?.userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await User.findByIdAndUpdate(
    payload?.userId,
    { role: payload?.role },
    {
      new: true,
      runValidators: true,
    }
  );

  return result;
};

export const AuthServices = {
  signup,
  loginUser,
  refreshToken,
  forgetPassword,
  verifyResetOtp,
  resendForgotPasswordOtp,
  resetPassword,
  changePassword,
  changeUserRole,
};
