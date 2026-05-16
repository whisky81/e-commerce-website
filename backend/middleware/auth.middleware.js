import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Forbidden from "../errors/ForbiddenError.js";
// import UnauthorizedError from "../errors/UnauthorizedError.js";
import AppError from "../errors/AppError.js";
import UnauthorizedError from "../errors/UnauthorizedError.js";

export const protect = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    const err = new UnauthorizedError();
    return next(err);
  }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user?.isActive) throw new AppError("Non-existent account.", 400, "NON_EXISTENT_ACCOUNT");
    return next();
};

export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    const err = new Forbidden();
    return next(err);
  }
  return next();
}