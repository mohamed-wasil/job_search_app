import { cloudinary } from "../Config/cloudinary.config.js";

export const uploadToCloudinary = async (filePath, folderPath) => {
    if (!filePath) return null;
    const result = await cloudinary().uploader.upload(filePath, { folder: folderPath });
    return { public_id: result.public_id, secure_url: result.secure_url };
};