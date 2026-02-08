import jwt from "jsonwebtoken"

const authUser = async (req, res, next) => {
    try {
        const {token} = req.headers 
        if (!token) {
            return res.json({
                success: false,
                message: 'Not authorized login again'
            })
        }
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = tokenDecode.id 
        next()
    } catch (error) {
        return res.json({
            success: false,
            message: error.message 
        })
    }
}

export default authUser