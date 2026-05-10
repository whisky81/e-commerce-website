import jwt from "jsonwebtoken";

const sendToken = (res, userId, role, statusCode, message) => {
    const token = jwt.sign(
        {
            id: userId,
            role: role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN
        }
    );
    res
        .status(statusCode)
        .cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
        .json({
            success: true,
            message,
            data: {
                id: userId,
                role: role,
                redrectUrl: role === "admin" ? process.env.ADMIN_URL : process.env.FRONTEND_URL
            }
        })
}

export default sendToken;