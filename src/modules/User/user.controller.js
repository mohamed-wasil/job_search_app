import { Router } from "express";
import * as profileServices from './Services/profile.service.js'
import * as chatServices from './Services/chat.service.js'
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { errorHandlerMiddleware } from "../../Middlewares/error-handler.middleware.js";
import { validationMiddleware } from "../../Middlewares/validator.middleware.js";
import { getProfileUserSchema, updatePasswordSchema, updateUserSchema } from "../../Validators/user.schema.js";
import { multerHostMiddleware } from "../../Middlewares/multer.middleware.js";

export const userController = Router()

userController.put(
    '/update',
    authenticationMiddleware(),
    validationMiddleware(updateUserSchema),
    errorHandlerMiddleware(profileServices.updateUserService)
)
userController.get(
    '/get-login-user',
    authenticationMiddleware(),
    errorHandlerMiddleware(profileServices.getLoginUserDataService)
)
userController.get(
    '/get-user-profile/:userId',
    authenticationMiddleware(),
    validationMiddleware(getProfileUserSchema),
    errorHandlerMiddleware(profileServices.getProfileUserDataService)
)
userController.patch(
    '/update-password',
    authenticationMiddleware(),
    validationMiddleware(updatePasswordSchema),
    errorHandlerMiddleware(profileServices.updatePasswordsService)
)
userController.patch('/update-profile-pic',
    authenticationMiddleware(),
    multerHostMiddleware().single("profile"),
    errorHandlerMiddleware(profileServices.updateProfilePicService)
)
userController.patch('/update-cover-pic',
    authenticationMiddleware(),
    multerHostMiddleware().single("cover"),
    errorHandlerMiddleware(profileServices.updateCoverPicService)
)
userController.delete('/delete-profile-pic',
    authenticationMiddleware(),
    errorHandlerMiddleware(profileServices.deleteProfilePicService)
)
userController.delete('/delete-cover-pic',
    authenticationMiddleware(),
    errorHandlerMiddleware(profileServices.deleteCoverPicService)
)
userController.delete('/soft-delete-account',
    authenticationMiddleware(),
    errorHandlerMiddleware(profileServices.softDeleteAccountService)
)
userController.delete('/delete-account',
    authenticationMiddleware(),
    errorHandlerMiddleware(profileServices.deleteUserServices)
)

userController.get('/get-chat-history/:receiverId',
    authenticationMiddleware(),
    errorHandlerMiddleware(chatServices.getChatServices)
)
userController.delete('/delete-chat-history/:receiverId',
    authenticationMiddleware(),
    errorHandlerMiddleware(chatServices.deleteChatHistoryServicve)
)