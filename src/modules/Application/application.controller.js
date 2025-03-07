import { Router } from "express";
import * as applicationServices from "./Services/application.service.js"
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middleware.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";
import { validationMiddleware } from "../../Middlewares/validator.middleware.js";
import { acceptOrRejectSchema, createApplicationSchema, exportCompanyApplicationsSchema, listApplicationsSchema } from "../../Validators/application.schema.js";
export const applicationController = Router({
    mergeParams: true,
})

applicationController.get(
    "/list-application/:jobId",
    authenticationMiddleware(),
    validationMiddleware(listApplicationsSchema),
    errorHandlerMiddleware(applicationServices.listApplicationsForSpecificJob)
)
applicationController.post(
    "/create/:jobId",
    authenticationMiddleware(),
    multerHostMiddleware(["pdf"]).single("cv"),
    validationMiddleware(createApplicationSchema),
    errorHandlerMiddleware(applicationServices.cretaeApplicationService)
)
applicationController.post(
    "/answer-job/:applicationId",
    authenticationMiddleware(),
    validationMiddleware(acceptOrRejectSchema),
    errorHandlerMiddleware(applicationServices.acceptOrRejectService)
)
applicationController.post(
    "/export",
    authenticationMiddleware(),
    validationMiddleware(exportCompanyApplicationsSchema),
    errorHandlerMiddleware(applicationServices.exportCompanyApplications)
)