import { hashSync } from "bcrypt";
import CryptoJS from "crypto-js"
export const Encryption = async ({ value, secretKey = process.env.ENCRYPTION_SECRET_KEY } = {}) => {
    return CryptoJS.AES.encrypt(value, secretKey).toString();
}
export const Decryption = async ({ cipher, secretKey = process.env.ENCRYPTION_SECRET_KEY } = {}) => {
    return CryptoJS.AES.decrypt(cipher, secretKey).toString(CryptoJS.enc.Utf8)
}

// const saltRounds = process.env.SALT_ROUND || 10
export const Hash = async ({ value, salt = process.env.SALT_ROUND } = {}) => {
    return hashSync(value, salt)
}