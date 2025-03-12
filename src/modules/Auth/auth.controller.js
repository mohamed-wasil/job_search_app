import { Router } from "express";
import * as authServices from "./Services/authentication.service.js"
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middleware.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { confirmEmail, resetPassword, signinSchema, signUpSchema } from "../../Validators/authentication.schema.js";
import { validationMiddleware } from "../../Middlewares/validator.middleware.js";

export const authController = Router()

authController.post(
    "/signup",
    multerHostMiddleware().fields([{ name: "profilePic", maxCount: 1 }, { name: "coverPic", maxCount: 1 }]),
    validationMiddleware(signUpSchema),
    errorHandlerMiddleware(authServices.signUpService)
)
authController.put(
    "/confirm-email",
    validationMiddleware(confirmEmail),
    errorHandlerMiddleware(authServices.confirmEmail)
)
authController.post(
    "/signin",
    validationMiddleware(signinSchema),
    errorHandlerMiddleware(authServices.signInService)
)
authController.post(
    '/signout',
    errorHandlerMiddleware(authServices.signOutService)
)

authController.post(
    "/gmail-login",
    errorHandlerMiddleware(authServices.gmailLoginService)
)
authController.post(
    "/gmail-signup",
    errorHandlerMiddleware(authServices.gmailSignUpService)
)
authController.post(
    "/forget-password/:email",
    errorHandlerMiddleware(authServices.forgetPasswordService)
)
authController.post(
    "/reset-password",
    validationMiddleware(resetPassword),
    errorHandlerMiddleware(authServices.resetPasswordService)
)
authController.post(
    "/refresh-token",
    errorHandlerMiddleware(authServices.refreshTokenServices)
)

