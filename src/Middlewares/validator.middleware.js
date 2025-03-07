/**
 * Middleware for validating request data against a predefined schema.
 * @function validationMiddleware
 * @param {Object} schema - An object containing validation rules for request properties (e.g., body, params, query)
 * @returns {Function} - Express middleware function for validating incoming requests
 * @throws {Error} - Returns a `401` response if validation fails
 * @description 
 * - Iterates over the schema keys and validates corresponding `req` properties.
 * - Collects all validation errors and returns a `401` response if any are found.
 * - Proceeds to the next middleware if validation passes.
 */

export const validationMiddleware = (schema) => {
    return (req, res, next) => {
        try {
            const schemaKeys = Object.keys(schema);
            let validateErrors = [];

            for (const key of schemaKeys) {
                const { error } = schema[key].validate(req[key], { abortEarly: false })

                if (error) validateErrors.push(...error.details)
            }
            if (validateErrors.length)
                return res.status(401).json({ message: "validate error", errors: validateErrors })
            next()
        } catch (error) {
            console.log("Error processing in validator middleware", error);
            res.status(500).json({ message: "Server error in validator middleware", error })

        }
    }
}