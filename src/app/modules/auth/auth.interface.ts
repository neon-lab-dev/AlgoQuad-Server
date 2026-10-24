export type TLoginAuth = {
  email: string;
  role?: string
  password: string;
};
import { Model } from "mongoose";
import { UserRole } from "./auth.constants";

export type TUser = {
  _id: string;
  profilePicture?: string;
  name: string;
  email: string;
  phoneNumber: string;
  gender: string;
  city?: string;
  state?: string;
  country?: string;
  password: string;
  role: "hr" | "admin";
  isDeleted?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  passwordChangedAt?: Date;
  isOtpVerified?: boolean;
  otp?: string | null;
  otpExpireAt?: Date | null;
  resetOtp?: string | null;
  resetOtpExpireAt?: Date | null;
  isResetOtpVerified?: boolean | null;
};

export interface UserModel extends Model<TUser> {
  isUserExists(email: string): Promise<TUser>;
  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string
  ): Promise<boolean>;
}

export type TUserRole = keyof typeof UserRole;
