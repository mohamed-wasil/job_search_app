import jwt from "jsonwebtoken"
/**
 * Generates a JWT token with public and registered claims.
 * @async
 * @function generateToken
 * @param {Object} options - The token generation options
 * @param {Object} options.publicClamis - The public claims to be included in the token payload
 * @param {string} [options.secretKey=process.env.JWT_SECRET_LOGIN] - The secret key used to sign the token
 * @param {Object} options.registerClamis - The registered claims such as expiration time and JWT ID
 * @returns {Promise<string>} - A signed JWT token
 * @throws {Error} - Throws an error if token generation fails
 * @description 
 * - Uses `jwt.sign` to generate a token with the provided claims.
 * - Includes public claims (e.g., user data) and registered claims (e.g., expiration time).
 * - Defaults to `process.env.JWT_SECRET_LOGIN` if no secret key is provided.
 */

export const generateToken = async ({
    publicClamis,
    secretKey = process.env.JWT_SECRET_LOGIN,
    registerClamis
} = {}) => {
    return jwt.sign(publicClamis, secretKey, registerClamis)
}

/**
 * Verifies and decodes a JWT token.
 * @async
 * @function verifyToken
 * @param {Object} options - The token verification options
 * @param {string} options.publicClamis - The JWT token to be verified
 * @param {string} [options.secretKey=process.env.JWT_SECRET_LOGIN] - The secret key used to verify the token
 * @returns {Promise<Object>} - The decoded token payload if verification is successful
 * @throws {Error} - Throws an error if token verification fails
 * @description 
 * - Uses `jwt.verify` to decode and validate the provided token.
 * - Ensures the token is signed with the correct secret key.
 * - Returns the decoded payload if the token is valid.
 */

export const verifyToken = async ({ token, secretKey = process.env.JWT_SECRET_LOGIN } = {}) => {
    return jwt.verify(token, secretKey)
}