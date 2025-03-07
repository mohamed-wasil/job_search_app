export const pagination = (page = 1, limit=2) => {
    if (page < 1) page = 1
    if (limit < 1) limit = 1
    const skip = (page - 1) * limit;
    return { skip, limit }
}