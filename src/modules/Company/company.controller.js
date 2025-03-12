import { Router } from "express";
import * as companyServices from "./Services/company.service.js"
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middleware.js";
import { jobController } from "../Job/job.controller.js";
import { applicationController } from "../Application/application.controller.js";
import { validationMiddleware } from "../../Middlewares/validator.middleware.js";
import { createCompanySchema, deleteCompanySchema, getCompanyByNameSchema, getCompanySchema, updateCompanyMediaSchema, updateCompanySchema } from "../../Validators/company.schema.js";

export const companyController = Router()
companyController.use("/job/:companyId", jobController)
companyController.use("/applications/:emailOfCompany", applicationController)

companyController.post(
    "/create",
    authenticationMiddleware(),
    multerHostMiddleware(["pdf", "jpeg", "png"]).fields([{ name: "logo", maxCount: 1 }, { name: "coverPic", maxCount: 1 }, { name: "legalAttachment", maxCount: 1 }]),
    validationMiddleware(createCompanySchema),
    errorHandlerMiddleware(companyServices.createCompanyService)
)
companyController.put(
    "/update-company/:emailOfCompany",
    authenticationMiddleware(),
    validationMiddleware(updateCompanySchema),
    errorHandlerMiddleware(companyServices.updateCompanyService)
)
companyController.delete(
    "/soft-delete-company/:emailOfCompany",
    authenticationMiddleware(),
    validationMiddleware(deleteCompanySchema),
    errorHandlerMiddleware(companyServices.softDeleteCompanyService)
)
companyController.delete(
    "/delete-company/:emailOfCompany",
    authenticationMiddleware(),
    validationMiddleware(deleteCompanySchema),
    errorHandlerMiddleware(companyServices.deleteCompanyService)
)
companyController.get(
    "/get-company/:companyId",
    authenticationMiddleware(),
    validationMiddleware(getCompanySchema),
    errorHandlerMiddleware(companyServices.getCompanyService)
)
companyController.get(
    "/get-company-name/:companyName",
    authenticationMiddleware(),
    validationMiddleware(getCompanyByNameSchema),
    errorHandlerMiddleware(companyServices.getCompanyByNameService)
)
companyController.patch(
    "/update-logo/:emailOfCompany",
    authenticationMiddleware(),
    multerHostMiddleware().single("logo"),
    validationMiddleware(updateCompanyMediaSchema),
    errorHandlerMiddleware(companyServices.updateCompanyLogoService)
)
companyController.patch(
    "/update-cover/:emailOfCompany",
    authenticationMiddleware(),
    multerHostMiddleware().single("cover"),
    validationMiddleware(updateCompanyMediaSchema),
    errorHandlerMiddleware(companyServices.updateCompanyCoverService)
)
companyController.delete(
    "/delete-logo/:emailOfCompany",
    authenticationMiddleware(),
    validationMiddleware(updateCompanyMediaSchema),
    errorHandlerMiddleware(companyServices.deleteCompanyLogoService)
)
companyController.delete(
    "/delete-cover/:emailOfCompany",
    authenticationMiddleware(),
    validationMiddleware(updateCompanyMediaSchema),
    errorHandlerMiddleware(companyServices.deleteCompanyCoverService)
)