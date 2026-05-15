import User from "../models/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendToken from "../utils/generateToken.js";
import validator from "validator";
import { sendVerificationEmail } from "../services/emailService.js";
import AppError from "../errors/AppError.js";
import NotFoundError from "../errors/NotFoundError.js";
import ApiResponse from "../utils/ApiResponse.js";
import ValidationError from "../errors/ValidationError.js";
import logger from "../config/Logger.js";
import Subscriber from "../models/Subscriber.js";

const generateVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ
  return { rawToken, hashed, expires };
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    throw new AppError("Missing required fields");
  if (!validator.isEmail(email))
    throw new ValidationError("Invalid email");
  if (await User.findOne({ email }))
    throw new AppError("Email already exists.", 400, "DUPLICATE_EMAIL");
  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
  const { rawToken, hashed, expires } = generateVerificationToken();
  const user = await User.create({
    name, email,
    password: hashedPassword,
    role: "user",
    isEmailVerified: false,
    emailVerificationToken: hashed,
    emailVerificationExpires: expires,
  });
  try {
    await sendVerificationEmail({ to: email, name, token: rawToken });
  } catch (mailErr) {
    logger.error("Verification email failed", {
      message: mailErr.message
    });
  }
  // setup subscriber (is that right??)
  const subscriber = await Subscriber.findOne({ email });
  if (!subscriber) {
    await Subscriber.create({
      email, name, user: user._id, isActive: false
    });
  }
  sendToken(res, user._id, user.role, 201, "Registration successful! Please check your email to verify your account.");
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new AppError("Missing email or password", 400, "MISSING_EMAIL_OR_PASSWORD");
  const user = await User.findOne({ email }).select("+password");
  if (!user)
    throw new NotFoundError("User does not exist, please sign up.");
  if (!await bcrypt.compare(password, user.password))
    throw new AppError("Incorrect password", 400, "INCORRECT_PASSWORD");
  sendToken(res, user._id, user.role, 200, "Logged in successfully.");
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    throw new AppError("Missing email or password", 400, "MISSING_EMAIL_OR_PASSWORD");
  const user = await User.findOne({ email }).select("+password");
  if (!user)
    throw new NotFoundError("User does not exist, please sign up.");
  if (user.role !== "admin")
    throw new AppError("Tài khoản không có quyền quản trị", 403, "NOT_ADMIN");
  if (!await bcrypt.compare(password, user.password))
    throw new AppError("Incorrect password", 400, "INCORRECT_PASSWORD");
  sendToken(res, user._id, user.role, 200, "Admin logged in successfully.");
};

export const logout = async (req, res) => {
  // enhanced: short lived token + refresh token
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "lax",
    secure: false
  });
  ApiResponse.success("Logged out successfully").send(res);

};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;
  if (!token)
    throw new AppError("Invalid token", 400, "INVALID_TOKEN");

  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ emailVerificationToken: hashed })
    .select("+emailVerificationToken +emailVerificationExpires");

  if (!user) {
    throw new AppError(
      "The verification link is invalid or has already been used. \
        If your email has already been verified, please log in normally.", 400, "");
  }
  if (user.emailVerificationExpires < Date.now()) {
    throw new AppError("The verification link has expired. \
        Please request a new verification email.", 400, "");
  }
  await User.findByIdAndUpdate(
    user._id,
    {
      $set: { isEmailVerified: true },
      $unset: { emailVerificationToken: "", emailVerificationExpires: "" }
    }
  );
  ApiResponse.success("Verified successfully").send(res);
};

export const resendVerification = async (req, res) => {
  const user = req.user;
  if (user.isEmailVerified)
    throw new AppError("Your email has been verified", 400, "");

  const { rawToken, hashed, expires } = generateVerificationToken();
  await User.findByIdAndUpdate(user._id, {
    emailVerificationToken: hashed,
    emailVerificationExpires: expires,
  });

  try {
    await sendVerificationEmail({ to: user.email, name: user.name, token: rawToken });
    ApiResponse.success("Success").send(res);
  } catch {
    new ApiResponse(false, 500, "Cannot send email. Please try again.").send(res);
  }
};
