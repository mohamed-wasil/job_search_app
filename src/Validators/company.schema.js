import Joi from "joi";

export const createCompanySchema = {
    body: Joi.object({
        companyName: Joi.string().trim().required().messages({
            "string-base": "companyName must be String",
            "any.required": "companyName is required "
        }),
        description: Joi.string().trim().required().messages({
            "string-base": "description must be String",
            "any.required": "description is required "
        }),
        industry: Joi.string().trim().required(),
        address: Joi.string().trim().required(),
        numberOfEmployees: Joi.string().valid('1-10', '11-20', '21-50', '51-100', '101-200', '201-500', '501+'),
        mobileNumber: Joi.string().regex(/^01[0125]{1}[0-9]{8}/).messages({
            "string.pattern.base": "Accepted only egyption numbers "
        }),
        companyEmail: Joi.string().email().required(),
        HRs: Joi.any(),
    })
}
export const updateCompanySchema = {
    body: Joi.object({
        // const { mobileNumber, DOB, firstName, lastName, gender } = req.body
        companyName: Joi.string().trim().messages({
            "string-base": "companyName must be String",
            "any.required": "companyName is required "
        }),
        description: Joi.string().trim().messages({
            "string-base": "description must be String",
            "any.required": "description is required "
        }),
        industry: Joi.string().trim(),
        address: Joi.string().trim(),
        numberOfEmployees: Joi.string().valid('1-10', '11-20', '21-50', '51-100', '101-200', '201-500', '501+'),
        companyEmail: Joi.string().email(),
        HRs: Joi.any(),
        employee: Joi.array().items(Joi.string().alphanum().length(24)),
    }),
    params: Joi.object({
        emailOfCompany: Joi.string().email().required()
    })
}
export const deleteCompanySchema = {
    params: Joi.object({
        emailOfCompany: Joi.string().email().required(),
    })
}
export const getCompanySchema = {
    params: Joi.object({
        companyId: Joi.string().alphanum().length(24)
    })
}
export const getCompanyByNameSchema = {
    params: Joi.object({
        companyName: Joi.string().alphanum().length(24)
    })
}
export const updateCompanyMediaSchema = {
    params: Joi.object({
        emailOfCompany: Joi.string().email().required(),
    })
}