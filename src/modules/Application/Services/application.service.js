import { nanoid } from "nanoid";
import { ApplicationStatusEnum, RoleEnum } from "../../../Constants/constants.js";
import Application from "../../../DB/models/application.model.js";
import Company from "../../../DB/models/company.model.js";
import JobOpportunity from "../../../DB/models/job-opportunity.model.js";
import User from "../../../DB/models/user.model.js";
import { uploadToCloudinary } from "../../../Utils/upload-to-cloudinary.utils.js";
import sendEmail from "../../../Services/semd-email.service.js";
import { pagination } from "../../../Utils/pagination.utils.js";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";;

/**
 * Lists applications for a specific job, with pagination and user details.
 *
 * @async
 * @function listApplicationsForSpecificJob
 * @api /application/list-application/:jobId
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.jobId - The ID of the job for which applications are being retrieved.
 * @param {Object} req.query - Query parameters for pagination.
 * @param {number} [req.query.page=1] - Page number for pagination (default is 1).
 * @param {number} [req.query.limit=10] - Number of applications per page (default is 10).
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a JSON object containing the total number of applications and the list of applications.
 * @throws {Error} - Returns an error response if the job has no applications or if any other issue occurs.
 *
 * @description
 * - Retrieves applications for a specific job.
 * - Supports pagination via query parameters.
 * - Populates user details (excluding sensitive fields).
 * - Sorts applications by creation date in descending order.
 * - Returns a response with the total application count and the paginated applications.
 */
export const listApplicationsForSpecificJob = async (req, res) => {
    const { jobId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: calculateLimit } = pagination(page, limit)

    const applications = await Application.find({ jobId }).skip(skip).limit(calculateLimit).populate([{
        path: 'userId',
        select: "-password -provider -OTP -__v -cretaedAt -updatedAt -changeCredentialTime"
    }]).sort({ createdAt: -1 })

    if (!applications.length) return res.status(409).json({ messager: "Not applications yet" })


    const allApplications = await Application.countDocuments({ jobId })

    res.status(201).json({ allApplications, applications })


}
/**
 * Creates a new job application for a specific job posting.
 *
 * @async
 * @function cretaeApplicationService
 * @api /application/create/:jobId
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user applying for the job.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.jobId - The ID of the job to apply for.
 * @param {Object} req.file - Uploaded CV file.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a success message upon successful application submission.
 * @throws {Error} - Returns an error response if authorization fails, the job does not exist, the user has already applied, or the CV is missing.
 *
 * @description
 * - Checks if the user has the correct role to apply.
 * - Validates if the job posting exists.
 * - Ensures the user has not already applied for the job.
 * - Requires a CV file for submission.
 * - Uploads the CV to Cloudinary under the company's designated folder.
 * - Saves the application in the database.
 */
export const cretaeApplicationService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { jobId } = req.params;
    const { file } = req

    const checkUserRole = await User.findById(_id)
    if (checkUserRole.role != RoleEnum.USER) return res.status(403).json({ message: "You are not authorized to apply for this job." })

    // Check if the job exists
    const job = await JobOpportunity.findById(jobId)
    if (!job) return res.status(404).json({ message: "Job not found." })

    // Check if the user has already applied for this job
    const checkApplication = await Application.findOne({ userId: _id, jobId })
    if (checkApplication) return res.status(400).json({ message: "You have already applied for this job." })


    if (!file) return res.status(400).json({ message: "Cv is required" })

    ///////////////////////////////////// error in mediaCloudFolder //////////////////////
    // Upload the cv
    const company = await Company.findById(job.companyId)
    const folderName = company?.mediaCloudFolder || (company.mediaCloudFolder = nanoid(4));

    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Company/${folderName}`;
    const userCV = await uploadToCloudinary(file.path, `${baseFolder}/CVs`)
    await company.save()

    // Create a new application for the job
    const application = new Application({
        jobId,
        userId: _id,
        userCV,
        appliedAt: new Date()
    })
    await application.save()

    res.status(201).json({ message: "Application created successfully" })
}
/**
 * Accepts or rejects a job application based on the provided status.
 *
 * @async
 * @function acceptOrRejectService
 * @api /application/answer-job/:applicationId
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in HR user making the decision.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.applicationId - The ID of the job application to update.
 * @param {Object} req.body - Request body containing the updated status.
 * @param {string} req.body.status - The new status of the application (ACCEPTED or REJECTED).
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a success message upon successful status update.
 * @throws {Error} - Returns an error response if:
 *   - The application does not exist.
 *   - The logged-in user is not authorized to update the application.
 *   - The provided status is invalid.
 *
 * @description
 * - Retrieves the job application by ID.
 * - Validates whether the logged-in HR user has authorization to update the application.
 * - Updates the application status to ACCEPTED or REJECTED.
 * - Sends an email notification to the applicant based on the decision.
 * - Saves the updated application status in the database.
 */
export const acceptOrRejectService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await Application.findById(applicationId)
    if (!application) return res.status(404).json({ message: "Application not found" })

    const job = await JobOpportunity.findById(application.jobId)
    const hr = await User.findById(_id)
    const company = await Company.findOne({ _id: job.companyId, HRs: _id })
    if (!company) return res.status(403).json({ message: "You are not authorized to accept for this job." })

    const user = await User.findById(application.userId)

    if (status === ApplicationStatusEnum.ACCEPTED) {
        //send email verrify
        sendEmail.emit('sendEmail', {
            to: user.email,
            subject: `${company.companyName}`,
            html: `
            <h2>Dear ${user.userName}</h2>
            <p>I am pleased to accept the offer for the <b>${job.jobTitle}</b> position at <b>${company.companyName}</b>. I appreciate the opportunity and am excited to contribute to your team.
                As discussed, I understand that my start date will be [Start Date], and I look forward to joining the company. Please let me know if there are any formalities or paperwork I need to complete before then.
                Thank you again for this opportunity. I am eager to get started and make a positive impact.
                Best regards,</p>
            <h4>${hr.userName}</h4>
            `
        })
    }
    else if (status === ApplicationStatusEnum.REJECTED) {

        //send email verrify
        sendEmail.emit('sendEmail', {
            to: user.email,
            subject: `${company.companyName}`,
            html: `
                <h2>Dear ${user.userName}</h2>
                <p>I sincerely appreciate the opportunity to join <b>${company.companyName}</b> as a <b>${job.jobTitle}</b>. After careful consideration, I have decided to decline the offer at this time. This was a difficult decision, as I have great respect for your team and the work you do.
                    I am truly grateful for the time and effort you and your team invested in the process, and I hope our paths cross again in the future. Wishing you and ${company.companyName} continued success.
                    Best regards,</p>
                <h4>${hr.userName}</h4>
                `
        })


    }
    application.status = status
    await application.save()
    res.status(200).json({ message: "Application status updated successfully" })

}
/**
 * Exports job applications for a specific company on a given date to an Excel file.
 *
 * @async
 * @function exportCompanyApplications
 * @api /company/:emailOfCompany/application/export
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.emailOfCompany - The email of the company to fetch applications for.
 * @param {Object} req.query - Query parameters.
 * @param {string} req.query.date - The specific date (YYYY-MM-DD) for which applications should be collected.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user requesting the data.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - Responds with a JSON message indicating success.
 * @throws {Error} - Returns an error response if any issue occurs.
 *
 * @description
 * - Checks if a valid date is provided.
 * - Verifies the user's authorization to access the company's applications.
 * - Fetches job applications submitted on the specified date.
 * - Exports the applications into an Excel file inside the "assets" folder.
 * - Returns a success message upon successful file generation.
 */
export const exportCompanyApplications = async (req, res) => {
    const { emailOfCompany } = req.params;
    const { date } = req.query;
    const { _id } = req.loggedInUser;

    if (!date) {
        return res.status(400).json({ message: "Date is required in YYYY-MM-DD format" });
    }

    const company = await Company.findOne({ companyEmail: emailOfCompany, $or: [{ createdBy: _id }, { HRs: _id }] });
    // return res.json({ company});
    if (!company) {
        return res.status(403).json({ message: "Unauthorized or company not found" });
    }

    const applications = await Application.find({
        createdAt: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lt: new Date(`${date}T23:59:59.999Z`)
        }
    }).populate([
        {
            path: "userId",
            select: "firstName lastName userName email phone"
        },
        {
            path: "jobId",
            select: "jobTitle"
        }
    ]);
    if (applications.length === 0) {
        return res.status(404).json({ message: "No applications found for the selected date" });
    }

    const data = applications.map(app => ({
        ApplicantName: app.userId.firstName,
        Email: app.userId.email,
        Phone: app.userId.phone,
        Position: app.jobId.jobTitle,
        Status: app.status,
        SubmittedAt: app.appliedAt.toISOString()
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, "Applications");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const srcIndex = __dirname.indexOf("src");
   
    const basePath = __dirname.substring(0, srcIndex + 3); // "+3" to include "src"

    const assetsPath = path.join(basePath, "Assets");
    console.log(assetsPath);


    if (!fs.existsSync(assetsPath)) {
        fs.mkdirSync(assetsPath, { recursive: true });
        console.log("Assets folder created at:", assetsPath);
    }
    
    const fileName = `applications_${emailOfCompany}_${date}.xlsx`;
    const filePath = path.join(assetsPath, fileName);
    
    // Write the Excel file inside the assets folder
    xlsx.writeFile(workbook, filePath);

    res.status(200).json({ message: "Excel sheet generated" })
};
