import { compareSync } from "bcrypt";
import User from "../../../DB/models/users.model.js";
import { Encryption } from "../../../Utils/encryption_hash.utils.js";
import { uploadToCloudinary } from "../../../Utils/upload-to-cloudinary.utils.js";
/**
 * Updates user details such as mobile number, date of birth, first name, last name, and gender.
 * @async
 * @function updateUserService
 * @api /user/update
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} req.body - Request body containing user details to update
 * @param {string} [req.body.mobileNumber] - The new mobile number to update (optional)
 * @param {string} [req.body.DOB] - The new date of birth to update (optional)
 * @param {string} [req.body.firstName] - The new first name to update (optional)
 * @param {string} [req.body.lastName] - The new last name to update (optional)
 * @param {string} [req.body.gender] - The new gender to update (optional)
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the user update process
 * @throws {Error} - Throws an error if the user is not found or if the update fails
 * @description 
 * - Finds the user by their ID.
 * - Updates the user's mobile number (hashed), date of birth, first name, last name, and gender if provided.
 * - Updates the `changeCredentialTime` to track when the user details were last modified.
 * - Saves the updated user details to the database.
 * - Returns a success message if the update is successful.
 */
export const updateUserService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { mobileNumber, DOB, firstName, lastName, gender } = req.body

    const user = await User.findById(_id)

    if (mobileNumber)  user.mobileNumber = mobileNumber;
    if (DOB) user.DOB = DOB;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (gender) user.gender = gender;
    user.changeCredentialTime = new Date()
    user.updatedBy = _id

    await user.save();
    res.status(200).json({ message: "User updated successfully" })

}
/**
 * Fetches the logged-in user's data, excluding sensitive information like password and version key.
 * Decrypts the user's mobile number before returning the data.
 * @async
 * @function getLoginUserDataService
 * @api /user/get-login-user
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the user's data with the decrypted mobile number
 * @throws {Error} - Throws an error if the user is not found or if decryption fails
 * @description 
 * - Finds the user by their ID, excluding the password and version key (`__v`) from the result.
 * - Decrypts the user's mobile number using a decryption utility.
 * - Returns the user's data with the decrypted mobile number in the response.
 */
export const getLoginUserDataService = async (req, res) => {
    const { _id } = req.loggedInUser;

    const user = await User.findOne({ _id }).select("-password -__v -OTP -isDeleted ")

    res.status(200).json({ message: "Fetched user data successfully", user })
}
/**
 * Fetches a user's profile data by their user ID, excluding sensitive information like the `_id` field.
 * Decrypts the user's mobile number before returning the data.
 * @async
 * @function getProfileUserDataService
 * @api /user/get-user-profile/:userId
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.userId - The ID of the user whose profile data is being fetched
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response containing the user's profile data with the decrypted mobile number
 * @throws {Error} - Throws an error if the user is not found or if decryption fails
 * @description 
 * - Finds the user by their ID, selecting only non-sensitive fields like `userName`, `firstName`, `lastName`, `mobileNumber`, `profilePic`, and `coverPic`.
 * - If the user is not found, returns a 409 conflict response with a "User not found" message.
 * - Decrypts the user's mobile number using a decryption utility.
 * - Returns the user's profile data with the decrypted mobile number in the response.
 */
export const getProfileUserDataService = async (req, res) => {
    const { userId } = req.params
    const user = await User.findById(userId).select("userName firstName lastName mobileNumber profilePic coverPic -_id")
    if (!user) return res.status(409).json({ message: "User not found" })

    res.status(200).json({ message: "Fetched user data successfully", user })
}
/**
 * Updates the logged-in user's password after validating the current password.
 * @async
 * @function updatePasswordsService
 * @api /user/update-password
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} req.body - Request body containing password details
 * @param {string} req.body.currentPassword - The user's current password for validation
 * @param {string} req.body.newPassword - The new password to update
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the password update process
 * @throws {Error} - Throws an error if the current password is invalid or if the update fails
 * @description 
 * - Finds the user by their ID.
 * - Validates the provided current password against the stored hashed password.
 * - If the current password is invalid, returns a 400 Bad Request response with an error message.
 * - Updates the user's password with the new password.
 * - Updates the `changeCredentialTime` to track when the password was last changed.
 * - Saves the updated user details to the database.
 * - Returns a success message if the password is updated successfully.
 */
export const updatePasswordsService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(_id)

    const isValid = compareSync(currentPassword, user.password)
    if (!isValid) return res.status(400).json({ message: "Invalid current password" })

    user.password = newPassword
    user.changeCredentialTime = new Date()
    user.updatedBy = _id

    await user.save()
    res.status(200).json({ message: "Password updated successfully" })
}
/**
 * Uploads a profile picture for the logged-in user and updates their profile picture URL in the database.
 * @async
 * @function updateProfilePicService
 * @api /user/update-profile-pic
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} req.file - Uploaded file object containing the profile picture
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the profile picture upload process
 * @throws {Error} - Throws an error if no file is uploaded, if the user is not found, or if the upload fails
 * @description 
 * - Checks if a file is uploaded. If not, returns a 401 Unauthorized response with an error message.
 * - Finds the user by their ID.
 * - Generates or retrieves the user's media cloud folder name.
 * - Uploads the profile picture to Cloudinary under a specific folder structure.
 * - Updates the user's `profilePic` field with the Cloudinary `public_id` and `secure_url`.
 * - Updates the `changeCredentialTime` to track when the profile picture was last updated.
 * - Saves the updated user details to the database.
 * - Returns a success message if the profile picture is uploaded successfully.
 */
export const updateProfilePicService = async (req, res) => {
    const { _id } = req.loggedInUser
    const { file } = req;

    if (!file) return res.status(401).json({ message: "No file uploaded" })

    const user = await User.findById(_id)
    const folderName = user.mediaCloudFolder || (user.mediaCloudFolder = nanoid(4))

    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Users/${folderName}/Profile`;
    user.profilePic = await uploadToCloudinary(file.path, baseFolder);
    
    user.changeCredentialTime = new Date()
    user.updatedBy = _id

    await user.save()
    res.status(201).json({ message: "Profile uploaded success successfully" })
}
/**
 * Uploads a cover picture for the logged-in user and updates their cover picture URL in the database.
 * @async
 * @function updateCoverPicService
 * @api /user/upload-cover-pic
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} req.file - Uploaded file object containing the cover picture
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the cover picture upload process
 * @throws {Error} - Throws an error if no file is uploaded, if the user is not found, or if the upload fails
 * @description 
 * - Checks if a file is uploaded. If not, returns a 401 Unauthorized response with an error message.
 * - Finds the user by their ID.
 * - Generates or retrieves the user's media cloud folder name.
 * - Uploads the cover picture to Cloudinary under a specific folder structure.
 * - Updates the user's `coverPic` field with the Cloudinary `public_id` and `secure_url`.
 * - Updates the `changeCredentialTime` to track when the cover picture was last updated.
 * - Saves the updated user details to the database.
 * - Returns a success message if the cover picture is uploaded successfully.
 */
export const updateCoverPicService = async (req, res) => {
    const { _id } = req.loggedInUser
    const { file } = req;

    if (!file) return res.status(401).json({ message: "No file uploaded" })

    const user = await User.findById(_id)
    const folderName = user.mediaCloudFolder || (user.mediaCloudFolder = nanoid(4))

    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Users/${folderName}/Cover`;
    user.coverPic = await uploadToCloudinary(file.path, baseFolder);

    user.changeCredentialTime = new Date()
    user.updatedBy = _id

    await user.save()
    res.status(201).json({ message: "Cover uploaded successfully" })
}
/**
 * Deletes the logged-in user's profile picture and updates the user's record in the database.
 * @async
 * @function deleteProfilePicService
 * @api /user/delete-profile-pic
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the profile picture deletion process
 * @throws {Error} - Throws an error if the user is not found or if the deletion fails
 * @description 
 * - Finds the user by their ID and removes the `profilePic` field from their record.
 * - Updates the `changeCredentialTime` to track when the profile picture was deleted.
 * - Returns a success message if the profile picture is deleted successfully.
 */
export const deleteProfilePicService = async (req, res) => {
    const { _id } = req.loggedInUser
    const user = await User.findByIdAndUpdate(
        _id,
        {
            $unset: { profilePic: 1 }, changeCredentialTime: new Date(), updatedBy: _id
        },
        { new: true }
    );

    res.status(200).json({ message: "Profile picture deleted successfully" })
}
/**
 * Deletes the logged-in user's cover picture and updates the user's record in the database.
 * @async
 * @function deleteCoverPicService
 * @api /user/delete-cover-pic
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the cover picture deletion process
 * @throws {Error} - Throws an error if the user is not found or if the deletion fails
 * @description 
 * - Finds the user by their ID and removes the `coverPic` field from their record.
 * - Updates the `changeCredentialTime` to track when the cover picture was deleted.
 * - Returns a success message if the cover picture is deleted successfully.
 */
export const deleteCoverPicService = async (req, res) => {
    const { _id } = req.loggedInUser
    const user = await User.findByIdAndUpdate(
        _id,
        { $unset: { coverPic: 1 }, changeCredentialTime: new Date(), updatedBy: _id },
        { new: true }
    );
    res.status(200).json({ message: "Cover picture deleted successfully" })
}
/**
 * Soft deletes the logged-in user's account by marking it as deleted and setting a deletion timestamp.
 * @async
 * @function softDeleteAccountService
 * @api /user/soft-delete-account
 * @param {Object} req - Express request object
 * @param {Object} req.loggedInUser - Logged-in user details
 * @param {string} req.loggedInUser._id - The ID of the logged-in user
 * @param {Object} res - Express response object
 * @returns {Promise<Response>} - JSON response indicating the result of the soft deletion process
 * @throws {Error} - Throws an error if the user is not found or if the soft deletion fails
 * @description 
 * - Finds the user by their ID and updates their record to mark the account as soft deleted.
 * - Sets the `isDeleted` field to `true` and adds a `deletedAt` timestamp to track when the account was soft deleted.
 * - Returns a success message if the soft deletion is successful.
 */
export const softDeleteAccountService = async (req, res) => {
    const { _id } = req.loggedInUser
    const user = await User.findByIdAndUpdate(
        _id,
        { isDeleted: true, deletedAt: new Date(), updatedBy: _id },
        { new: true }
    );
    res.status(200).json({ message: "Account soft deleted successfully" })
}

export const deleteUserServices = async (req, res) => {
    const { _id } = req.loggedInUser
    await User.findByIdAndDelete(_id);
    res.status(200).json({ message: "User deleted successfully" })
}

