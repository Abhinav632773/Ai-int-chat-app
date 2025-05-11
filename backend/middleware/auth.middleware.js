import jwt from "jsonwebtoken";
import redisclient from "../services/redis.service.js";

export const authUser = async (req, res, next) => {
    try {
        const token =
            req.cookies.token ||
            (req.headers.authorization && req.headers.authorization.split(" ")[1]);

        if (!token) {
            return res.status(401).json({ error: "Unauthorized: No token provided" });
        }

        // Check if the token is blacklisted in Redis
        const isBlackListed = await redisclient.get(token);
        if (isBlackListed) {
            res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
            return res.status(401).json({ error: "Unauthorized: Token is blacklisted" });
        }

        // Verify JWT Token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;  // Assign decoded user info
            console.log("Logged-in User from Middleware:", req.user); // Now req.user is defined
            next();
        } catch (error) {
            return res.status(401).json({ error: "Unauthorized: Invalid token" });
        }

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
