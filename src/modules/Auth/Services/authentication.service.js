import { compareSync, hashSync } from "bcrypt"
import { OtpEnum, ProviderEnum } from "../../../Constants/constants.js"
import User from "../../../DB/models/user.model.js"
import sendEmail from "../../../Services/semd-email.service.js"
import { Hash } from "../../../Utils/encryption_hash.utils.js"
import { generateToken, verifyToken } from "../../../Utils/generate-tokens.utils.js"
import { nanoid } from "nanoid"
import { OAuth2Client } from "google-auth-library"
import cron from "node-cron";
import { uploadToCloudinary } from "../../../Utils/upload-to-cloudinary.utils.js"
import BlackListTokens from "../../../DB/models/black-list-tokens.model.js"

/**
 * Handles user registration by creating a new account and sending a verification email.
 * @async
 * @function signUpService
 * @api /auth/signup
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user details
 * @param {string} req.body.firstName - The first name of the new user
 * @param {string} req.body.lastName - The last name of the new user
 * @param {string} req.body.email - The email address of the new user (must be unique)
 * @param {string} req.body.password - The password for the new user account
 * @param {string} req.body.provider - The authentication provider ("google" or "system")
 * @param {string} req.body.gender - The gender of the new user ("Male" or "Female")
 * @param {string} req.body.DOB - The date of birth of the new user (must be 18+)
 * @param {string} req.body.mobileNumber - The phone number of the new user
 * @param {string} req.body.role - The role assigned to the new user ("User" or "Admin")
 * @param {Object} [req.body.profilePic] - Profile picture object containing secure URL and public ID
 * @param {string} [req.body.profilePic.secure_url] - Secure URL of the profile picture
 * @param {string} [req.body.profilePic.public_id] - Public ID of the profile picture
 * @param {Object} [req.body.coverPic] - Cover picture object containing secure URL and public ID
 * @param {string} [req.body.coverPic.secure_url] - Secure URL of the cover picture
 * @param {string} [req.body.coverPic.public_id] - Public ID of the cover picture
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the registration process
 * @throws {Error} - Throws an error if the email already exists, OTP hashing fails, or user registration fails
 * @description 
 * - Checks if the email is already registered.
 * - Generates a 6-digit OTP for email verification.
 * - Hashes the OTP before storing it in the database.
 * - Sends a verification email to the user.
 * - Creates and saves a new user in the database with OTP details.
 * - Returns a success message upon successful registration.
 */
export const signUpService = async (req, res) => {
    const { firstName, lastName, email, password, provider, gender, DOB, mobileNumber, role } = req.body
    const { files } = req;

    // Check if user already exist by email address
    const isUserExist = await User.findOne({ email })
    if (isUserExist) return res.status(400).json({ message: "User is already exist" })

    //create otp and hash it
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = await Hash({ value: otp, salt: process.env.SALT_ROUND })

    //send email verrify
    sendEmail.emit('sendEmail', {
        to: email,
        subject: "Verify your email",
        html: `<h3>Your Otp Is ${otp}</h3>`
    })

    // Set OTP expiry time (e.g., 15 minutes from now)
    const expiresIn = new Date();
    expiresIn.setMinutes(expiresIn.getMinutes() + 10);

    const folderName = nanoid(4)
    const user = new User({
        firstName,
        lastName,
        email,
        password,
        provider,
        gender,
        DOB,
        OTP: [{ code: hashedOtp, type: OtpEnum.CONFIRM_EMAIL, expiresIn }],
        mobileNumber,
        role,
        mediaCloudFolder: folderName
    })

    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Users/${folderName}`;

    if (files?.profilePic) {
        user.profilePic = await uploadToCloudinary(files.profilePic[0]?.path, `${baseFolder}/Profile`);
    }
    if (files?.coverPic) {
        user.coverPic = await uploadToCloudinary(files.coverPic[0]?.path, `${baseFolder}/Cover`);
    }
    await user.save()

    res.status(201).json({ message: "User Registered Successfully , please check your email to verify" })
}
/**
 * Confirms a user's email by verifying the OTP.
 * @async
 * @function confirmEmail
 * @api /auth/confirm-email
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing user details
 * @param {string} req.body.email - The email address of the user to confirm
 * @param {string} req.body.code - The OTP code provided by the user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the email confirmation process
 * @throws {Error} - Throws an error if the user is not found, OTP is invalid, or has expired
 * @description 
 * - Finds the user by email.
 * - Retrieves the OTP of type `CONFIRM_EMAIL`.
 * - Checks if the OTP is valid and not expired.
 * - Compares the provided OTP with the stored hashed OTP.
 * - If OTP is valid, updates the user's `isEmailConfirmed` status.
 * - Updates the `changeCredentialTime` to track when the email was confirmed.
 * - Removes the used OTP from the user's record.
 */
export const confirmEmail = async (req, res) => {
    const { email, code } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: "User not found" })

    // Check Otp enum
    const otp = user.OTP.find(o => o.type === OtpEnum.CONFIRM_EMAIL)
    if (!otp || !otp.code || otp.expiresIn < new Date()) return res.status(400).json({ message: "Invalid OTP or OTP expired" })


    // Compare hashed OTP with stored hashed OTP
    const isMatch = compareSync(code, otp.code)
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" })


    // Update user status to confirmed
    user.isConfirmed = true
    user.changeCredentialTime = new Date()
    user.OTP = user.OTP.filter(o => o.type !== OtpEnum.CONFIRM_EMAIL)
    await user.save()

    res.status(200).json({ message: "Email confirmed successfully" })

}
/**
 * Authenticates a user by verifying credentials and generating access & refresh tokens.
 * @async
 * @function signInService
 * @api /auth/signin
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing login credentials
 * @param {string} req.body.email - The email address of the user
 * @param {string} req.body.password - The user's password
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the authentication tokens
 * @throws {Error} - Throws an error if credentials are invalid or authentication fails
 * @description 
 * - Finds the user by email where the provider is "system".
 * - Compares the provided password with the stored hashed password.
 * - If credentials are valid, generates an **access token** and **refresh token**.
 * - Returns the tokens in the response for further authentication.
 */
export const signInService = async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email, provider: "system" })
    if (!user || !compareSync(password, user.password)) return res.status(401).json({ message: "Invalid credentials" })
    const accessToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.firstName + " " + user.lastName, email: user.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME, jwtid: nanoid(5) }
        })

    const refreashToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.firstName + " " + user.lastName, email: user.email },
            secretKey: process.env.JWT_SECRET_REFRESH,
            registerClamis: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME, jwtid: nanoid(5) }
        })

    res.json({ message: "User authenticated successfully", token: { accessToken, refreashToken } })
}
/**
 * Handles user sign-out by blacklisting access and refresh tokens.
 * @async
 * @function signOutService
 * @param {Object} req - Express request object
 * @param {Object} req.headers - Request headers containing authentication tokens
 * @param {string} req.headers.token - The access token of the user
 * @param {string} req.headers.refreshtoken - The refresh token of the user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response confirming successful logout
 * @throws {Error} - Throws an error if token verification fails
 * @description 
 * - Verifies the access and refresh tokens using JWT.
 * - Extracts token IDs and expiration times.
 * - Stores the tokens in the blacklist to prevent reuse.
 * - Returns a success message upon successful logout.
 */

export const signOutService = async (req, res) => {
    const { token, refreshtoken } = req.headers;

    const decodedToken = await verifyToken({ token })
    const decodedRefreshToken = await verifyToken({ token: refreshtoken, secretKey: process.env.JWT_SECRET_REFRESH })

    await BlackListTokens.insertMany([
        {
            tokenId: decodedToken.jti,
            expierdAt: decodedToken.exp
        },
        {
            tokenId: decodedRefreshToken.jti,
            expierdAt: decodedRefreshToken.exp
        }
    ])
    res.status(201).json({ message: "Logged out Successfully" })

}
/**
 * Handles user registration via Google authentication.
 * @async
 * @function gmailSignUpService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing Google authentication details
 * @param {string} req.body.idToken - The ID token received from Google authentication
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the sign-up process
 * @throws {Error} - Throws an error if email verification fails or the email already exists
 * @description 
 * - Verifies the Google ID token using OAuth2Client.
 * - Extracts user email and checks if it is verified.
 * - Checks if the email is already registered with Google as a provider.
 * - If not, creates a new user with a randomly generated password.
 * - Saves the user to the database and marks them as verified.
 * - Returns a success message upon successful sign-up.
 */

export const gmailSignUpService = async (req, res) => {
    const { idToken } = req.body
    // console.log(idToken);

    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email_verified, given_name, family_name, email } = payload;

    if (!email_verified) return res.status(400).json({ message: "Invalid gmail credentials" })

    const isEmailExist = await User.findOne({ email, provider: ProviderEnum.GOOGLE })
    if (isEmailExist) return res.status(400).json({ message: "Email already exist" })


    const user = new User({
        firstName: given_name,
        lastName: family_name,
        email,
        password: hashSync(nanoid(7), +process.env.SALT_ROUND),
        provider: ProviderEnum.GOOGLE,
        isConfirmed: true
    })
    await user.save()
    res.status(201).json({ message: "signup successfully" })

}
/**
 * Handles user login via Google authentication.
 * @async
 * @function gmailLoginService
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing Google authentication details
 * @param {string} req.body.idToken - The ID token received from Google authentication
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing access and refresh tokens upon successful login
 * @throws {Error} - Throws an error if email verification fails or the user is not found
 * @description 
 * - Verifies the Google ID token using OAuth2Client.
 * - Extracts user email and checks if it is verified.
 * - Searches for the user in the database with Google as the provider.
 * - If found, generates an access token and a refresh token.
 * - Returns a success message along with authentication tokens.
 */
export const gmailLoginService = async (req, res) => {
    const { idToken } = req.body
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email_verified, email } = payload;

    if (!email_verified) return res.status(400).json({ message: "Invalid gmail credentials" })

    const user = await User.findOne({ email, provider: ProviderEnum.GOOGLE })
    if (!user) return res.status(400).json({ message: "User not found . Please Signup" })

    const accessToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.firstName + " " + user.lastName, email: user.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME, jwtid: nanoid(5) }
        })

    const refreashToken = await generateToken(
        {
            publicClamis: { _id: user._id, name: user.firstName + " " + user.lastName, email: user.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME, jwtid: nanoid(5) }
        })
    res.status(201).json({ message: "Login in success", tokens: { token: accessToken, refreashToken } })
}
/**
 * Handles the forget password process by generating a one-time password (OTP),
 * hashing it, storing it in the user’s record, and sending an email with the OTP.
 * 
 * @async
 * @function forgetPasswordService
 * @api /auth/forgot-password
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user.
 * @param {string} req.loggedInUser.email - The email address of the logged-in user.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming OTP has been sent.
 * @throws {Error} - Throws an error if the user is not found or the OTP process fails.
 * 
 * @description
 * - Retrieves the user by their ID from the database.
 * - Generates a **6-digit OTP**, hashes it, and sets an expiration time.
 * - Updates the user record with the OTP and expiry timestamp.
 * - Sends an email containing the OTP to the user's registered email address.
 * - Saves the updated user data and responds with a confirmation message.
 */
export const forgetPasswordService = async (req, res) => {
    const { email } = req.params;

    const user = await User.findOne({ email })

    // return res.json({user})

    //create otp and hash it
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = await Hash({ value: otp })

    // Set OTP expiry time (e.g., 15 minutes from now)
    const expiresIn = new Date();
    expiresIn.setMinutes(expiresIn.getMinutes() + 10);

    // Update user's OTP and OTP expiry time
    user.OTP.push({ type: OtpEnum.FORGET_PASSWORD, code: hashedOtp, expiresIn })

    //send email verrify
    sendEmail.emit('sendEmail', {
        to: email,
        subject: "Reset Password",
        html: `<h3>Your Otp Is ${otp}</h3>`
    })
    await user.save()
    res.status(200).json({ message: "OTP sent to your email" })
}
/**
 * Resets a user's password after verifying the OTP.
 * 
 * @async
 * @function resetPasswordService
 * @api /auth/reset-password
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user.
 * @param {Object} req.body - Request body containing reset details.
 * @param {string} req.body.password - The new password to be set.
 * @param {string} req.body.confirmOtp - The OTP entered by the user for verification.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming password reset.
 * @throws {Error} - Throws an error if OTP verification fails or the user is not found.
 * 
 * @description
 * - Retrieves the user from the database using their ID.
 * - Checks if a valid OTP exists for **password reset** and verifies its expiration.
 * - Compares the provided OTP with the stored **hashed OTP**.
 * - If valid, removes the OTP record from the user’s account.
 * - Updates the user's password and sets a **credential change timestamp**.
 * - Saves the updated user details and responds with a success message.
 */
export const resetPasswordService = async (req, res) => {
    const { email } = req.params;
    const {password, confirmOtp } = req.body;

    const user = await User.findOne({email})

    // Verify OTP
    const otp = user?.OTP?.find(o => o.type === OtpEnum.FORGET_PASSWORD)
    if (!otp || !otp.code || otp.expiresIn < new Date()) return res.status(400).json({ message: "Invalid OTP or OTP expired" })


    // Compare hashed OTP with stored hashed OTP
    const isMatch = compareSync(confirmOtp, otp.code)
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP " })

    // Remove OTP from user's list
    user.OTP = user.OTP.filter(o => o.type !== OtpEnum.FORGET_PASSWORD)

    // Update user's password
    user.password = password
    user.changeCredentialTime = new Date()

    // Save user's changes
    await user.save()
    res.status(200).json({ message: "Password reset successfully" })
}
/**
 * Refreshes the user's authentication token using a valid refresh token.
 * 
 * @async
 * @function refreshTokenServices
 * @api /auth/refresh-token
 * @param {Object} req - Express request object.
 * @param {Object} req.headers - Headers containing the refresh token.
 * @param {string} req.headers.refreshtoken - The refresh token used to generate a new access token.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response containing the new access token.
 * @throws {Error} - Throws an error if the refresh token is missing or invalid.
 * 
 * @description
 * - Extracts the **refresh token** from the request headers.
 * - Verifies and decodes the refresh token using the **JWT secret key**.
 * - Generates a new **access token** using the decoded user data.
 * - Returns the new token in the response with a success message.
 */
export const refreshTokenServices = async (req, res) => {
    const { refreshtoken } = req.headers
    if (!refreshtoken) return res.status(401).json({ message: 'No refresh token provided' })

    const decodedData = await verifyToken({ token: refreshtoken, secretKey: process.env.JWT_SECRET_REFRESH })
    const accessToken = await generateToken(
        {
            publicClamis: { _id: decodedData._id, name: decodedData.name, email: decodedData.email },
            secretKey: process.env.JWT_SECRET_LOGIN,
            registerClamis: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME, jwtid: nanoid(5) }
        })

    res.status(201).json({ message: "Token Refreshed Success", token: accessToken })
}
/**
 * Deletes expired OTPs from all users' records.
 * 
 * @async
 * @function deleteExpiredOtps
 * @returns {Promise<void>} - Logs the cleanup status after execution.
 * @throws {Error} - Logs an error if the deletion process fails.
 * 
 * @description
 * - Retrieves the current timestamp.
 * - Uses MongoDB's `$pull` operator to remove expired OTPs from all users.
 * - Logs the number of matched and modified documents.
 * - Runs automatically every **6 hours** using a scheduled cron job.
 * - Optionally executes once when the server starts.
 */

const deleteExpiredOtps = async () => {
    try {
        console.log("Running OTP Cleanup Job...");

        const now = new Date();

        // Delete expired OTPs for all users
        const result = await User.updateMany(
            {},
            { $pull: { OTP: { expiresIn: { $lt: now } } } }
        );
    } catch (error) {
        console.error("Error deleting expired OTPs:", error);
    }
};

//  run every 6 hours
cron.schedule("0 */6 * * *", async () => {
    await deleteExpiredOtps();
}, {
    scheduled: true,
    timezone: "UTC"
});

// Optional: Run once on server start
deleteExpiredOtps();