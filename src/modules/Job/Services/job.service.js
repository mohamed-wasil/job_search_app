import Company from "../../../DB/models/company.model.js";
import JobOpportunity from "../../../DB/models/job-opportunity.model.js";
import { pagination } from "../../../Utils/pagination.utils.js";

/**
 * Creates a new job opportunity for a specific company.
 *
 * @async
 * @function createJobOpportunityService
 * @api /job/create/:companyId
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user creating the job.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.companyId - The ID of the company for which the job is being created.
 * @param {Object} req.body - Request body containing job details.
 * @param {string} req.body.jobTitle - The title of the job position.
 * @param {string} req.body.jobLocation - The location of the job.
 * @param {string} req.body.workingTime - The working hours (e.g., Full-time, Part-time).
 * @param {string} req.body.seniorityLevel - The required seniority level (e.g., Junior, Mid, Senior).
 * @param {string} req.body.jobDescription - A detailed description of the job role.
 * @param {string[]|string} req.body.technicalSkills - Required technical skills (can be an array or a single value).
 * @param {string[]|string} req.body.softSkills - Required soft skills (can be an array or a single value).
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a success message upon successful job creation.
 * @throws {Error} - Returns an error response if:
 *   - The company does not exist.
 *   - The logged-in user is not authorized (not an HR or creator of the company).
 *   - Any required field is missing or invalid.
 *
 * @description
 * - Validates if the logged-in user has the right to create a job for the specified company.
 * - Ensures technicalSkills and softSkills are stored as arrays.
 * - Creates a new job opportunity in the database.
 * - Saves the job opportunity and returns a success response.
 */
export const createJobOpportunityService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { companyId } = req.params;
    let { jobTitle, jobLocation, workingTime, seniorityLevel, jobDescription, technicalSkills, softSkills } = req.body;

    const company = await Company.findOne({
        _id: companyId,
        $or: [{ createdBy: _id }, { HRs: _id }]
    })
    if (!company) return res.status(400).json({ message: "Invalid company or you are not a HR" })

    technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : [technicalSkills];
    softSkills = Array.isArray(softSkills) ? softSkills : [softSkills];

    const newJobOpportunity = new JobOpportunity({
        jobTitle,
        jobLocation,
        workingTime,
        seniorityLevel,
        jobDescription,
        technicalSkills,
        softSkills,
        addedBy: _id,
        companyId
    })
    await newJobOpportunity.save()
    res.status(201).json({ message: "Job added successfully" })

}
/**
 * Updates an existing job opportunity for a specific company.
 *
 * @async
 * @function updateJobOpportunityService
 * @api /job/update-job/:companyId/:jobOpportunityId
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @returns {Promise<Response>} - Responds with a success message upon successful job update.
 * @throws {Error} - Returns an error response if:
 *   - The company does not exist or the logged-in user is not the owner.
 *   - The job opportunity does not exist or does not belong to the logged-in user.
 *   - Any unexpected error occurs during the update process.
 *
 * @description
 * - Validates whether the logged-in user is authorized to update the job.
 * - Ensures that the provided updates are applied to the job opportunity.
 * - Converts `technicalSkills` and `softSkills` to arrays if necessary.
 * - Updates the `updatedBy` field to track modifications.
 * - Saves the changes and returns a success response.
 */
export const updateJobOpportunityService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { companyId, jobOpportunityId } = req.params;
    let { jobTitle, jobLocation, workingTime, seniorityLevel, jobDescription, technicalSkills, softSkills, closed } = req.body;

    const company = await Company.findOne({
        _id: companyId,
        createdBy: _id
    })
    if (!company) return res.status(400).json({ message: "Invalid company or you are not the owner" })

    const jobOpportunity = await JobOpportunity.findOne({
        _id: jobOpportunityId,
        addedBy: _id
    })
    if (!jobOpportunity) return res.status(400).json({ message: "Invalid job or you are not the owner" })

    if (jobTitle) jobOpportunity.jobTitle = jobTitle;
    if (jobLocation) jobOpportunity.jobLocation = jobLocation;
    if (workingTime) jobOpportunity.workingTime = workingTime;
    if (seniorityLevel) jobOpportunity.seniorityLevel = seniorityLevel;
    if (jobDescription) jobOpportunity.jobDescription = jobDescription;

    if (technicalSkills?.length || technicalSkills) {
        technicalSkills = Array.isArray(technicalSkills) ? technicalSkills : [technicalSkills];
        jobOpportunity.technicalSkills = technicalSkills;
    }
    if (softSkills?.length || softSkills) {
        softSkills = Array.isArray(softSkills) ? softSkills : [softSkills];
        jobOpportunity.softSkills = softSkills;
    }
    if (closed) jobOpportunity.closed = closed;
    jobOpportunity.updatedBy = _id;

    await jobOpportunity.save()
    res.status(200).json({ message: "Job updated successfully" })
}
/**
 * Deletes an existing job opportunity for a specific company.
 *
 * @async
 * @function deleteJobOpportunityService
 * @api /job/delete-job/:companyId/:jobOpportunityId
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in HR user attempting to delete the job.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.companyId - The ID of the company that owns the job.
 * @param {string} req.params.jobOpportunityId - The ID of the job opportunity to delete.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a success message upon successful job deletion.
 * @throws {Error} - Returns an error response if:
 *   - The company does not exist or the logged-in user is not an HR of the company.
 *   - The job opportunity does not exist.
 *   - Any unexpected error occurs during deletion.
 *
 * @description
 * - Validates whether the logged-in user has the HR role for the specified company.
 * - Ensures that the job opportunity exists before attempting to delete it.
 * - Removes the job opportunity from the database.
 * - Returns a success response if deletion is successful.
 */
export const deleteJobOpportunityService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { companyId, jobOpportunityId } = req.params;
    const company = await Company.findOne({
        _id: companyId,
        HRs: _id
    })
    if (!company) return res.status(400).json({ message: "Invalid company or you are not a HR" })


    const jobOpportunity = await JobOpportunity.findByIdAndDelete(jobOpportunityId)
    if (!jobOpportunity) return res.status(400).json({ message: "Invalid job" })

    res.status(200).json({ message: "Job deleted successfully" })
}
/**
 * Retrieves job opportunities for a specific company with pagination.
 *
 * @async
 * @function getJobService
 * @api /job/list-job
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.companyId - The ID of the company whose job opportunities are being fetched.
 * @param {Object} req.query - Query parameters for pagination.
 * @param {number} [req.query.page] - The page number for pagination (default is 1).
 * @param {number} [req.query.limit] - The number of jobs per page (default is 10).
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a list of job opportunities and total job count.
 * @throws {Error} - Returns an error response if:
 *   - The specified company does not exist.
 *   - Any unexpected error occurs during data retrieval.
 *
 * @description
 * - Validates whether the company exists.
 * - Applies pagination parameters to fetch a limited number of jobs.
 * - Sorts the jobs by creation date in descending order.
 * - Returns the total job count along with paginated job data.
 */
export const getJobService = async (req, res) => {
    const { companyId } = req.params;
    const { page, limit } = req.query;

    const { skip, limit: calculateLimit } = pagination(page, limit)

    const company = await Company.findById(companyId);
    if (!company) return res.status(400).json({ message: "Company not found" });

    const jobs = await JobOpportunity.find({ companyId }).limit(calculateLimit).skip(skip).sort({ createdAt: -1 })

    const allJobs = await JobOpportunity.countDocuments({ companyId })



    res.status(201).json({ message: "Fetched jobs successfully", allJobs, jobs })
}
/**
 * Retrieves job opportunities based on specified filters with pagination.
 *
 * @async
 * @function getFilterJobsService
 * @api /job/list-filter-jobs
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Body parameters for filtering jobs.
 * @param {string} [req.body.jobTitle] - The title of the job (case-insensitive regex search).
 * @param {string} [req.body.jobLocation] - The location of the job.
 * @param {string} [req.body.workingTime] - The working time type (e.g., full-time, part-time).
 * @param {string} [req.body.seniorityLevel] - The seniority level required for the job.
 * @param {string} [req.body.technicalSkills] - A comma-separated list of technical skills required.
 * @param {Object} req.query - Query parameters for pagination.
 * @param {number} [req.query.page] - The page number for pagination (default is 1).
 * @param {number} [req.query.limit] - The number of jobs per page (default is 10).
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a filtered list of job opportunities and the total count.
 * @throws {Error} - Returns an error response if:
 *   - Any unexpected error occurs during data retrieval.
 *
 * @description
 * - Builds a dynamic query based on provided filters.
 * - Uses case-insensitive regex for job title searches.
 * - Filters jobs based on working time, location, seniority level, and technical skills.
 * - Applies pagination parameters to limit and skip results.
 * - If no jobs match the filters, retrieves the latest jobs as a fallback.
 */
export const getFilterJobsService = async (req, res) => {
    const { jobTitle, jobLocation, workingTime, seniorityLevel, technicalSkills } = req.body;
    const { page, limit } = req.query;
    const { skip, limit: calculateLimit } = pagination(page, limit)

    let query = {};

    if (workingTime) query.workingTime = workingTime;
    if (jobLocation) query.jobLocation = jobLocation;
    if (seniorityLevel) query.seniorityLevel = seniorityLevel;
    if (jobTitle) query.jobTitle = { $regex: new RegExp(jobTitle, "i") };
    if (technicalSkills) {
        query.technicalSkills = { $in: technicalSkills.split(",") };
    }
    let jobs = await JobOpportunity.find(query).limit(calculateLimit).skip(skip).sort({ createdAt: -1 })

    if (!jobs.length) jobs = await JobOpportunity.find().limit(calculateLimit).skip(skip).sort({ createdAt: -1 })

    const countJobs = jobs.length

    res.status(201).json({ message: "Fetched filtered jobs successfully", countJobs, jobs })
}

