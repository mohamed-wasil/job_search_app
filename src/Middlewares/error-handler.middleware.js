export const errorHandlerMiddleware =  (api) => {
    return (req, res, next) => {
        api(req, res, next).catch((error) => {
            console.log(`error from ${req.url} from error handler middlewasre`, error);
            next(new Error(error.message, { cause: 500 }))
        })
    }
}
export const globalErrorMiddleWareHandler = (err, req, res, next) => {
    if (err) {
        return res.status(500).json({ message: "error in global middleware handler", error: err.message })
    }
    next()
}