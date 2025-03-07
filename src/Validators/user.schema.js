import Joi from "joi";
import { GenderEnum } from "../Constants/constants.js";


export const updateUserSchema = {
    body: Joi.object({
        firstName: Joi.string().trim().messages({
            "string-base": "first name must be String",
            "any.required": "first name is required "
        }),
        lastName: Joi.string().trim().messages({
            "string-base": "last name must be String",
            "any.required": "last name is required "
        }),
        mobileNumber: Joi.string().regex(/^01[0125]{1}[0-9]{8}/).messages({
            "string.pattern.base": "Accepted only egyption numbers "
        }),
        gender: Joi.string().valid(...Object.values(GenderEnum)),
        DOB: Joi.date(),
    })
}
export const getProfileUserSchema = {
    params: Joi.object({
        userId: Joi.string().alphanum().length(24)
    }),
}
export const updatePasswordSchema = {
    body: Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/).messages({
            "string.pattern.base": "password must be at least 8 char long and contain one uppercase letter , one spical char ",
        }),
        confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
    })
}