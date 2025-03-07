import multer from "multer";
import fs from 'fs'

/**
 * Middleware for handling file uploads using Multer with local storage.
 * @function multerLocalMiddleware
 * @param {string} [destinationPath='general'] - The destination folder inside `Assets/` where files will be stored
 * @param {string[]} [allwedExtintion=[]] - An array of allowed MIME types for file uploads
 * @returns {multer.Multer} - Returns a configured Multer instance for handling file uploads
 * @throws {Error} - Logs an error if the Multer setup fails
 * @description 
 * - Creates the destination folder if it doesn't exist.
 * - Uses Multer's `diskStorage` to define file destination and naming conventions.
 * - Filters uploaded files based on allowed MIME types.
 * - Returns a configured Multer instance to handle file uploads.
 */
/**
 * Middleware for handling file uploads using Multer with customizable file storage.
 * @function multerHostMiddleware
 * @param {string[]} [allwedExtintion=[]] - An array of allowed MIME types for file uploads
 * @returns {multer.Multer} - Returns a configured Multer instance for handling file uploads
 * @throws {Error} - Logs an error if the Multer setup fails
 * @description 
 * - Uses Multer's `diskStorage` to define the file naming convention (original filename).
 * - Filters uploaded files based on allowed MIME types.
 * - If a file's MIME type is not allowed, appends a unique suffix to its filename.
 * - Returns a configured Multer instance to handle file uploads.
 */
export const multerHostMiddleware = (allwedExtintion = []) => {
    try {
        const storage = multer.diskStorage({
            filename:(req, file, cb) => {
                cb(null, file.originalname)
            }
        })

        const fileFilter = (req, file, cb) => {
            if (allwedExtintion.includes(file.mimetype))
                cb(null, true)
            else {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
                cb(null, uniqueSuffix + '_' + file.originalname)
            }
        }

        const upload = multer({ fileFilter, storage })

        return upload
    } catch (error) {
        console.log("multer middleware error :", error);
    }
}

