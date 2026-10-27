import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import config from "../../config";
import { TUser, UserModel } from "./auth.interface";

const userSchema = new Schema<TUser, UserModel>(
  {
    profilePicture: {
      type: String,
      required: false,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    state: {
      type: String,
      required: false,
      trim: true,
    },
    country: {
      type: String,
      required: false,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["hr", "employee", "admin"],
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      trim: true,
      default: null,
    },
    passwordChangedAt: {
      type: Date,
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpireAt: {
      type: Date,
      default: null,
    },
    isResetOtpVerified: {
      type: Boolean,
      default: false,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Hashing password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_round)
    );
  }
  next();
});

// Hide password after saving
userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});

// Static methods
userSchema.statics.isUserExists = async function (email: string) {
  return await this.findOne({ email }).select("+password");
};

userSchema.statics.isPasswordMatched = async function (
  plainTextPassword: string,
  hashedPassword: string
) {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const User = model<TUser, UserModel>("User", userSchema);