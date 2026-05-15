/**
 * Seed admin user from .env configuration.
 *
 * Usage:
 *   node scripts/seedAdmin.js
 *
 * Reads ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME from .env.
 * If the admin already exists, updates the password.
 * If not, creates a new admin user with verified email.
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const {
  MONGODB_URI,
  ADMIN_EMAIL = "admin@example.com",
  ADMIN_PASSWORD = "admin123456",
  ADMIN_NAME = "Admin",
} = process.env;

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected.");

  const email = ADMIN_EMAIL.trim().toLowerCase();
  let admin = await User.findOne({ email });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, await bcrypt.genSalt(10));

  if (admin) {
    console.log(`📝 Admin user "${email}" already exists — updating role & password.`);
    admin.password = hashedPassword;
    admin.role = "admin";
    admin.isEmailVerified = true;
    admin.isActive = true;
    if (!admin.name || admin.name === "Admin") admin.name = ADMIN_NAME;
    await admin.save();
    console.log(`✅ Admin "${email}" updated successfully.`);
  } else {
    admin = await User.create({
      name: ADMIN_NAME,
      email,
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`✅ Admin "${email}" created successfully.`);
  }

  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     ${admin.role}`);

  await mongoose.disconnect();
  console.log("🔌 Disconnected.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
