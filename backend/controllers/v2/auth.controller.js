import User from "../../models/v2/User.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendToken from "../../utils/generateToken.js";
import validator from "validator";
import { sendVerificationEmail } from "../../services/emailService.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const generateVerificationToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed  = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { rawToken, hashed, expires };
};

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ success: false, message: "Thiếu thông tin bắt buộc" });

        if (!validator.isEmail(email))
            return res.status(400).json({ success: false, message: "Email không hợp lệ" });

        if (await User.findOne({ email }))
            return res.status(409).json({ success: false, message: "Email đã tồn tại" });

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

        // Gửi email xác nhận (không block nếu lỗi SMTP)
        try {
            await sendVerificationEmail({ to: email, name, token: rawToken });
        } catch (mailErr) {
            console.error("Verification email failed:", mailErr.message);
        }

        sendToken(res, user._id, user.role, 201, "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.");
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ success: false, message: "Thiếu email hoặc mật khẩu" });

        const user = await User.findOne({ email }).select("+password");
        if (!user)
            return res.status(404).json({ success: false, message: "Tài khoản không tồn tại" });

        if (!await bcrypt.compare(password, user.password))
            return res.status(401).json({ success: false, message: "Mật khẩu không đúng" });

        sendToken(res, user._id, user.role, 200, "Đăng nhập thành công");
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        res.cookie("token", "", { httpOnly: true, expires: new Date(0), sameSite: "lax", secure: false });
        return res.status(200).json({ success: true, message: "Đăng xuất thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi khi đăng xuất", error: error.message });
    }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token)
            return res.status(400).json({ success: false, message: "Token không hợp lệ" });

        const hashed = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            emailVerificationToken: hashed,
            emailVerificationExpires: { $gt: Date.now() },
        }).select("+emailVerificationToken +emailVerificationExpires");

        if (!user)
            return res.status(400).json({ success: false, message: "Link xác nhận không hợp lệ hoặc đã hết hạn" });

        user.isEmailVerified       = true;
        user.emailVerificationToken   = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: "Email đã được xác nhận thành công! Bạn có thể mua sắm ngay." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};

// ─── Resend Verification Email ────────────────────────────────────────────────
export const resendVerification = async (req, res) => {
    try {
        const user = req.user; // từ protect middleware

        if (user.isEmailVerified)
            return res.status(400).json({ success: false, message: "Email của bạn đã được xác nhận" });

        const { rawToken, hashed, expires } = generateVerificationToken();
        await User.findByIdAndUpdate(user._id, {
            emailVerificationToken: hashed,
            emailVerificationExpires: expires,
        });

        try {
            await sendVerificationEmail({ to: user.email, name: user.name, token: rawToken });
            res.status(200).json({ success: true, message: "Email xác nhận đã được gửi lại!" });
        } catch {
            res.status(500).json({ success: false, message: "Không thể gửi email, vui lòng thử lại sau" });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};
