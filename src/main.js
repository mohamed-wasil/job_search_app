import express from "express"
import { config } from "dotenv";
import cors from 'cors'
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import databaseConnection from "./DB/connectionDb.js";
import { authController } from "./modules/Auth/auth.controller.js";
import { globalErrorMiddleWareHandler } from "./Middlewares/error-handler.middleware.js";
import { userController } from "./modules/User/user.controller.js";
import { companyController } from "./modules/Company/company.controller.js";
import { jobController } from "./modules/Job/job.controller.js";
import { applicationController } from "./modules/Application/application.controller.js";
import { Server } from "socket.io";
import { establishIoConnection } from "./Utils/socket.utils.js";
config()


const whitelist = [process.env.FRONTEND_ORIGIN, process.env.FRONTEND_ORIGIN_TWO, undefined]
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

const bootstrap = () => {
    const port = process.env.PORT || 3000
    databaseConnection()

    const app = express()
    app.use("/assets", express.static('assets'))

    app.get('/', (req, res) => { res.json({ message: "Welcome in Jop Search App" }) })

    app.use(limiter)
    app.use(helmet());
    app.use(express.json())
    app.use(cors(corsOptions))
    app.use("/auth", authController)
    app.use("/user", userController)
    app.use("/company", companyController)
    app.use("/job", jobController)
    app.use("/application", applicationController)

    app.all("*", (req, res) => {
        res.status(404).json({ message: "Page Not Found!" })
    })


    app.use(globalErrorMiddleWareHandler)
    const server = app.listen(port, () => {
        console.log("server is running in port", port);
    })

    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN_TWO
        }
    })
    establishIoConnection(io)
}

export default bootstrap