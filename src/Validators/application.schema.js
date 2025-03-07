import Joi from "joi";
import { ApplicationStatusEnum } from "../Constants/constants.js";

export const listApplicationsSchema = {
    params: Joi.object({
        jobId: Joi.string().alphanum().length(24),
    }),
    query: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(10)
    })
}
export const createApplicationSchema = {
    body: Joi.object({
        status: Joi.string().valid(...Object.values(ApplicationStatusEnum)),
    }),
    params: Joi.object({
        jobId: Joi.string().alphanum().length(24).required(),
    })
}
export const acceptOrRejectSchema = {
    body: Joi.object({
        status: Joi.string().valid(...Object.values(ApplicationStatusEnum)),
    }),
    params: Joi.object({
        applicationId: Joi.string().alphanum().length(24).required(),
    })
}
export const exportCompanyApplicationsSchema = {
    body: Joi.object({
        status: Joi.string().valid(...Object.values(ApplicationStatusEnum)),
    }),
    params: Joi.object({
        emailOfCompany: Joi.string().email().required(),
    }),
    query: Joi.object({
        date: Joi.date().required()
    })
}