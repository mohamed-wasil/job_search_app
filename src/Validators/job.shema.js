import Joi from "joi";
import { JobLocationEnum, SeniorityLevelEnum, WorkingTimeEnum } from "../Constants/constants.js";

export const createJobSchema = {
    body: Joi.object({
        jobTitle: Joi.string().trim().required().messages({
            "string-base": "first name must be String",
            "any.required": "first name is required "
        }),
        jobLocation: Joi.string().trim().valid(...Object.values(JobLocationEnum)).required(),
        workingTime: Joi.string().trim().valid(...Object.values(WorkingTimeEnum)).required(),
        seniorityLevel: Joi.string().trim().valid(...Object.values(SeniorityLevelEnum)).required(),
        jobDescription: Joi.string().trim().required().messages({
            "string-base": "first name must be String",
            "any.required": "first name is required "
        }),
        technicalSkills: Joi.array().items(Joi.string()).required(),
        softSkills: Joi.array().items(Joi.string()).required(),
    }),
    params: Joi.object({
        companyId: Joi.string().alphanum().length(24).required()
    })
}
export const updateJobSchema = {
    body: Joi.object({
        jobTitle: Joi.string().trim().messages({
            "string-base": "jobTitle must be String",
            "any.required": "jobTitle is required "
        }),
        jobLocation: Joi.string().trim().valid(...Object.values(JobLocationEnum)),
        workingTime: Joi.string().trim().valid(...Object.values(WorkingTimeEnum)),
        seniorityLevel: Joi.string().trim().valid(...Object.values(SeniorityLevelEnum)),
        jobDescription: Joi.string().trim().messages({
            "string-base": "jobDescription name must be String",
            "any.required": "jobDescription name is required "
        }),
        technicalSkills: Joi.array().items(Joi.string()),
        softSkills: Joi.array().items(Joi.string())
    }),
    params: Joi.object({
        companyId: Joi.string().alphanum().length(24),
        jobOpportunityId: Joi.string().alphanum().length(24)
    })
}
export const deleteJobSchema = {
    params: Joi.object({
        companyId: Joi.string().alphanum().length(24),
        jobOpportunityId: Joi.string().alphanum().length(24)
    })
}
export const getJobSchema = {
    params: Joi.object({
        companyId: Joi.string().alphanum().length(24)
    }),
    query: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(10)
    })
}

export const listFilterJobSchema = {
    query: Joi.object({
        page: Joi.number().min(1),
        limit: Joi.number().min(1).max(10),
    }),
    body: Joi.object({
        jobTitle: Joi.string().trim().messages({
            "string-base": "jobTitle must be String",
            "any.required": "jobTitle is required "
        }),
        jobLocation: Joi.string().trim().valid(...Object.values(JobLocationEnum)),
        workingTime: Joi.string().trim().valid(...Object.values(WorkingTimeEnum)),
        seniorityLevel: Joi.string().trim().valid(...Object.values(SeniorityLevelEnum)),
        technicalSkills: Joi.string(),
        softSkills: Joi.string(),
    }),
}