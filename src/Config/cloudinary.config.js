import { v2 as cloudinaryV2 } from 'cloudinary'

export const cloudinary = () => {
    cloudinaryV2.config({
        cloud_name: process.env.CLODUINARY_NAME,
        api_key: process.env.CLODUINARY_API_KEY,
        api_secret: process.env.CLODUINARY_API_SECRET
    });
    return cloudinaryV2;
}

