import { Router } from "express";
import * as jobServices from "./Services/job.service.js"
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middleware.js";
import { validationMiddleware } from "../../Middlewares/validator.middleware.js";
import { createJobSchema, deleteJobSchema, getJobSchema, listFilterJobSchema, updateJobSchema } from "../../Validators/job.shema.js";
export const jobController = Router({
    mergeParams: true,
});

jobController.post(
    "/create/:companyId",
    authenticationMiddleware(),
    validationMiddleware(createJobSchema),
    errorHandlerMiddleware(jobServices.createJobOpportunityService)
)
jobController.put(
    "/update-job/:companyId/:jobOpportunityId",
    authenticationMiddleware(),
    validationMiddleware(updateJobSchema),
    errorHandlerMiddleware(jobServices.updateJobOpportunityService)
)
jobController.delete(
    "/delete-job/:companyId/:jobOpportunityId",
    authenticationMiddleware(),
    validationMiddleware(deleteJobSchema),
    errorHandlerMiddleware(jobServices.deleteJobOpportunityService)
)
jobController.get(
    "/list-job",
    authenticationMiddleware(),
    validationMiddleware(getJobSchema),
    errorHandlerMiddleware(jobServices.getJobService)
)
jobController.get(
    "/list-filter-jobs",
    authenticationMiddleware(),
    validationMiddleware(listFilterJobSchema),
    errorHandlerMiddleware(jobServices.getFilterJobsService)
)
