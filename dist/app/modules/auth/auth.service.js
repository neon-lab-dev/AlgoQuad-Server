"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const auth_utils_1 = require("./auth.utils");
const auth_model_1 = require("./auth.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const sendEmail_1 = require("../../utils/sendEmail");
const employee_model_1 = __importDefault(require("../employee/employee.model"));
const signup = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Checking if user already exists
    const isUserExistsByEmail = yield auth_model_1.User.findOne({ email: payload.email });
    const isUserExistsByPhoneNumber = yield auth_model_1.User.findOne({
        phoneNumber: payload.phoneNumber,
    });
    if (isUserExistsByEmail) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "User already exists with this email.");
    }
    if (isUserExistsByPhoneNumber) {
        throw new AppError_1.default(http_status_1.default.CONFLICT, "User already exists with this phone number.");
    }
    // Creating the user
    const result = yield auth_model_1.User.create(payload);
    return result;
});
// Login
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if user exists
    const user = yield auth_model_1.User.isUserExists(payload.email);
    const employee = yield employee_model_1.default.findOne({ userId: user === null || user === void 0 ? void 0 : user._id });
    if ((employee === null || employee === void 0 ? void 0 : employee.accountStatus) === "Inactive") {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account has been deactivated. Please contact to HR for further assistance.");
    }
    if ((user === null || user === void 0 ? void 0 : user.role) !== "admin" && !employee) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No account found with this email address.");
    }
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "No account found with this email address. Please sign up first.");
    }
    // Deleted account check
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Your account has been deleted. Please contact our support team if you need assistance or call us at 09617785588");
    }
    // Suspended account check
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account has been deactivated. Please contact our support team for further assistance or call us at 09617785588");
    }
    // Password validation
    const isPasswordMatched = yield auth_model_1.User.isPasswordMatched(payload.password, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Incorrect password. Please try again.");
    }
    // JWT Payload
    const jwtPayload = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profilePicture: user.profilePicture || "",
        isFirstLogin: user.isFirstLogin,
    };
    // Tokens
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
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
            isFirstLogin: user.isFirstLogin,
        },
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure token was sent
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized to proceed!");
    }
    // Verify token
    const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_refresh_secret);
    const { email } = decoded;
    // Check user exists
    const user = yield auth_model_1.User.isUserExists(email);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    // Deleted account check
    if (user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User does not exists.");
    }
    // Suspended account check
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account has been deactivated. Please contact our support team for further assistance or call us at 09617785588");
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
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
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
});
const buildResetOtpEmail = (otp) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; margin: 0;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="background-color: #32AADB; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">AlgoQuad</h1>
      </div>

      <!-- Body -->
      <div style="padding: 40px 30px;">
        <h2 style="color: #2c2c2c; margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 600; text-align: center;">Password Reset Request</h2>
        
        <p style="font-size: 15px; color: #525252; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          Hello,<br>
          We received a request to reset your password. Use the verification code below to proceed.
        </p>

        <!-- OTP Box -->
        <div style="background-color: #f1f5f9; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #32AADB; letter-spacing: 8px; padding-left: 8px;">${otp}</p>
        </div>

        <p style="font-size: 14px; color: #525252; line-height: 1.6; margin-bottom: 8px; text-align: center;">
          <strong>Note:</strong> This code is valid for <strong>2 minutes</strong>.
        </p>

        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 0; text-align: center;">
          If you didn't request this change, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #71717a;">
          Best regards,<br>
          <strong style="color: #2c2c2c;">The AlgoQuad Team</strong>
        </p>
      </div>

    </div>
  </div>
`;
const forgetPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findOne({ email });
    if (!user || user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account is suspended. Please contact support.");
    }
    //  6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    yield user.save();
    const subject = "Reset Your Password - AlgoQuad";
    const htmlBody = buildResetOtpEmail(otp);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, subject, htmlBody);
    }
    catch (error) {
        console.error("❌ Failed to send reset OTP email:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to send reset OTP. Please try again.");
    }
    return {};
});
const resendForgotPasswordOtp = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findOne({ email });
    if (!user || user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account is suspended. Please contact support.");
    }
    // 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpireAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min
    yield user.save();
    const subject = "Resend: Reset Your Password - AlgoQuad";
    const htmlBody = buildResetOtpEmail(otp);
    try {
        yield (0, sendEmail_1.sendEmail)(user.email, subject, htmlBody);
    }
    catch (error) {
        console.error("❌ Failed to resend reset OTP email:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to resend reset OTP. Please try again.");
    }
    return {};
});
const verifyResetOtp = (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findOne({ email });
    if (!user || user.isDeleted) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    if (!user.resetOtp || user.resetOtp !== otp) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Invalid OTP");
    }
    if (!user.resetOtpExpireAt || user.resetOtpExpireAt < new Date()) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "OTP expired");
    }
    user.isResetOtpVerified = true;
    user.resetOtp = null;
    user.resetOtpExpireAt = null;
    yield user.save();
    return {};
});
const resetPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword, purpose } = payload;
    const user = yield auth_model_1.User.findOne({ email }).select("+password");
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    if (user.isSuspended) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your account is suspended. Please contact support.");
    }
    if (purpose !== "firstTimeLogin" && !user.isResetOtpVerified) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "OTP not verified. Please verify OTP before resetting password.");
    }
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    // Clear OTP state
    user.isResetOtpVerified = false;
    user.resetOtp = null;
    user.resetOtpExpireAt = null;
    if (purpose === "firstTimeLogin") {
        user.isFirstLogin = false;
    }
    yield user.save();
    return {
        success: true,
        message: "Password reset successfully",
    };
});
const changePassword = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(userId).select("+password");
    // Checking if the user exists
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found!");
    }
    // Check if the current password is correct
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.currentPassword, user.password);
    if (!isPasswordMatched) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Current password is incorrect!");
    }
    // Hash the new password
    const newHashedPassword = yield bcrypt_1.default.hash(payload.newPassword, Number(config_1.default.bcrypt_salt_round));
    yield auth_model_1.User.findByIdAndUpdate(userId, {
        password: newHashedPassword,
    });
});
// Change user role (For admin)
const changeUserRole = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield auth_model_1.User.findById(payload === null || payload === void 0 ? void 0 : payload.userId);
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    const result = yield auth_model_1.User.findByIdAndUpdate(payload === null || payload === void 0 ? void 0 : payload.userId, { role: payload === null || payload === void 0 ? void 0 : payload.role }, {
        new: true,
        runValidators: true,
    });
    return result;
});
exports.AuthServices = {
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
