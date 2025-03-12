import Joi from "joi";
import { GenderEnum, ProviderEnum, RoleEnum } from "../Constants/constants.js";

export const signUpSchema = {
    body: Joi.object({
        firstName: Joi.string().trim().required().messages({
            "string-base": "first name must be String",
            "any.required": "first name is required "
        }),
        lastName: Joi.string().trim().required().messages({
            "string-base": "last name must be String",
            "any.required": "last name is required "
        }),
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/).messages({
            "string.pattern.base": "password must be at least 8 char long and contain one uppercase letter , one spical char ",
        }),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
        mobileNumber: Joi.string().regex(/^01[0125]{1}[0-9]{8}/).messages({
            "string.pattern.base": "Accepted only egyption numbers "
        }),
        gender: Joi.string().valid(...Object.values(GenderEnum)),
        provider: Joi.string().valid(...Object.values(ProviderEnum)),
        DOB: Joi.date(),
        role: Joi.string().valid(...Object.values(RoleEnum)),
        age: Joi.string()

    })
}
export const confirmEmail = {
    body: Joi.object({
        email: Joi.string().email().required(),
        code: Joi.string().required()
    })
}
export const signinSchema = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    })
}
export const resetPassword = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/).messages({
            "string.pattern.base": "password must be at least 8 char long and contain one uppercase letter , one spical char ",
        }),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
        confirmOtp: Joi.string().max(6).required()
    })
}