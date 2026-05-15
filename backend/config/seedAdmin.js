import User from "../models/User.js";
import bcrypt from "bcryptjs";
import logger from "./Logger.js";

/**
 * Seed a default admin account if none exists.
 * Run after DB connection is established.
 */
const seedAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      logger.info("Admin account already exists, skipping seed");
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@abcshop.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    // If a regular user with the same email exists, upgrade them to admin
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      existingUser.role = "admin";
      existingUser.isEmailVerified = true;
      await existingUser.save();
      logger.info("Existing user upgraded to admin", { email: adminEmail });
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, await bcrypt.genSalt(10));
    await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true,
    });

    logger.info("Default admin account seeded", {
      email: adminEmail,
      passwordHint: "Use ADMIN_EMAIL / ADMIN_PASSWORD env vars to customize",
    });
  } catch (err) {
    logger.error("Failed to seed admin account", { error: err.message });
  }
};

export default seedAdmin;
