// backend/config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const setTokenCookie = (res, user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

// ─── Google Strategy ──────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v2/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value });
          if (!user) {
            user = await User.create({
              name:            profile.displayName,
              email:           profile.emails[0].value,
              password:        `google_${profile.id}_${Math.random().toString(36)}`,
              isEmailVerified: true,
              avatar:          profile.photos?.[0]?.value || null,
              role:            "user",
            });
          } else if (!user.avatar && profile.photos?.[0]?.value) {
            // Cập nhật avatar nếu chưa có
            await User.findByIdAndUpdate(user._id, { avatar: profile.photos[0].value });
          }
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

// ─── Facebook Strategy ────────────────────────────────────────────────────────
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID:     process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL:  `${process.env.BACKEND_URL || "http://localhost:5000"}/api/v2/auth/facebook/callback`,
        profileFields: ["id", "emails", "name", "picture.type(large)"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || `fb_${profile.id}@facebook-user.com`;
          const avatar = profile.photos?.[0]?.value || null;
          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              name:            `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim() || "Facebook User",
              email,
              password:        `facebook_${profile.id}_${Math.random().toString(36)}`,
              isEmailVerified: true,
              avatar,
              role:            "user",
            });
          } else if (!user.avatar && avatar) {
            await User.findByIdAndUpdate(user._id, { avatar });
          }
          done(null, user);
        } catch (e) {
          done(e);
        }
      }
    )
  );
}

export { setTokenCookie };
export default passport;
