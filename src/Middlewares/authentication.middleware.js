import jwt from "jsonwebtoken"
import BlackListTokens from "../DB/Models/black-list-tokens.model.js";
import User from "../DB/models/user.model.js";

/**
 * Validates a user's authentication token by checking its validity and blacklist status.
 * @async
 * @function validateUserToken
 * @param {string} token - The JWT access token to be validated
 * @returns {Promise<Object>} - The user data along with token details if valid
 * @throws {Error} - Throws an error if the token is invalid, blacklisted, or the user is not found
 * @description 
 * - Decodes and verifies the provided token using JWT.
 * - Checks if the token is blacklisted.
 * - Fetches the user from the database while excluding sensitive fields.
 * - Returns the user's data along with token details if validation is successful.
 */

const validateUserToken = async (token, res) => {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_LOGIN)

    const isBlackListed = await BlackListTokens.findOne({ tokenId: decodedData.jti })
    if (isBlackListed) return res.status(403).json({ message: 'Token blackklisted, please login again' });

    const user = await User.findById(decodedData._id, "-password -__v")
    if (!user) return res.status(403).json({ message: 'Please Signup' });

    return {
        ...user._doc, token: { tokenId: decodedData.jti, expierdAt: decodedData.exp }
    }
}
/**
 * Middleware for authenticating users via JWT tokens in HTTP requests or WebSockets.
 * @function authenticationMiddleware
 * @param {Object} [socket=null] - Optional WebSocket object for authentication in socket connections
 * @returns {Function|Promise<Object>} - Returns a middleware function for Express or validates a token for WebSockets
 * @throws {Error} - Throws an error if authentication fails
 * @description 
 * - If a `socket` is provided, it validates the token directly.
 * - If used as middleware:
 *   - Extracts the token from request headers.
 *   - Calls `validateUserToken` to authenticate the user.
 *   - Attaches the authenticated user data to `req.loggedInUser`.
 *   - Calls `next()` to proceed to the next middleware.
 *   - Handles errors, including token expiration or authentication failure.
 */
export const authenticationMiddleware = (socket = null) => {
    if (socket) return validateUserToken(socket)
    return async (req, res, next) => {
        try {
            const { token } = req.headers;
            req.loggedInUser = await validateUserToken(token, res)

            next()
        } catch (error) {
            console.log(error);
            // if (err.name === 'TokenExpiredError') return res.status(401).json({ message: "this token is expired , please login" })
            return res.status(500).json({ message: "Somthing wrong from authMiddleware", error })

        }
    }
}