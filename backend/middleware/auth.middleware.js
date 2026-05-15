import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Forbidden from "../errors/ForbiddenError.js";
import AppError from "../errors/AppError.js";
import UnauthorizedError from "../errors/UnauthorizedError.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return next(new UnauthorizedError());
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user?.isActive) throw new AppError("Non-existent account.", 400, "NON_EXISTENT_ACCOUNT");
    return next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new UnauthorizedError());
    }
    return next(err);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    const err = new Forbidden();
    return next(err);
  }
  return next();
};
