import { nanoid } from "nanoid";
import Company from "../../../DB/models/company.model.js";
import User from "../../../DB/models/user.model.js";
import { uploadToCloudinary } from "../../../Utils/upload-to-cloudinary.utils.js";
import { RoleEnum } from "../../../Constants/constants.js";
import { cloudinary } from "../../../Config/cloudinary.config.js";

/**
 * Creates a new company and associates it with the logged-in user.
 * 
 * @async
 * @function createCompanyService
 * @api /company/create
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user creating the company.
 * @param {Object} req.body - Request body containing company details.
 * @param {string} req.body.companyName - The name of the company.
 * @param {string} req.body.description - A brief description of the company.
 * @param {string} req.body.industry - The industry sector of the company.
 * @param {string} req.body.address - The physical or registered address of the company.
 * @param {number} req.body.numberOfEmployees - The number of employees in the company.
 * @param {string} req.body.companyEmail - The official email address of the company.
 * @param {string[]|string} [req.body.HRs] - Array of user IDs for HR representatives (optional).
 * @param {Object} req.files - Object containing uploaded files.
 * @param {Object[]} [req.files.logo] - Uploaded logo file (optional).
 * @param {Object[]} [req.files.coverPic] - Uploaded cover picture file (optional).
 * @param {Object[]} [req.files.legalAttachment] - Uploaded legal attachment file (optional).
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the company creation.
 * @throws {Error} - Throws an error if the company already exists or HR validation fails.
 * 
 * @description
 * - Checks if a company with the same name and email already exists.
 * - Creates a new company record with details provided in the request.
 * - If HRs are provided, validates that they are existing users.
 * - Uploads company-related media (logo, cover picture, legal documents) to Cloudinary.
 * - Updates the logged-in user to have an **ADMIN** role and associates them with the company.
 * - Saves the company record and responds with a success message.
 */
export const createCompanyService = async (req, res) => {
    let { companyName, description, industry, address, numberOfEmployees, companyEmail, HRs } = req.body;
    const { _id } = req.loggedInUser;
    const { files } = req;

    const isCompanyExist = await Company.findOne({
        companyName,
        companyEmail
    })
    if (isCompanyExist) return res.status(400).json({ message: "Company already exists" })


    // if(HRs.)
    const company = new Company({
        companyName,
        description,
        industry,
        address,
        numberOfEmployees,
        companyEmail,
        createdBy: _id,
        employee: [_id]
    });
    if (HRs?.length || HRs) {

        if (!Array.isArray(HRs)) {
            HRs = [HRs]
        }

        const isUsers = await User.find({ _id: { $in: HRs } })
        if (!isUsers.length || isUsers.length != HRs?.length) return res.status(401).json({ message: "Not valid users" })
        company.HRs = HRs
    }
    // return  res.status(200).json({data:files?.logo[0]?.path })
    const folderName = nanoid(4);
    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Company/${folderName}`;

    if (files?.logo) company.logo = await uploadToCloudinary(files?.logo?.[0]?.path, `${baseFolder}/Logo`);
    if (files?.coverPic) company.coverPic = await uploadToCloudinary(files?.coverPic?.[0]?.path, `${baseFolder}/Cover`);
    if (files?.legalAttachment) company.legalAttachment = await uploadToCloudinary(files?.legalAttachment?.[0]?.path, `${baseFolder}/Legal_Attachment`);

    if (files?.length) company.mediaCloudFolder = folderName;

    await company.save()

    await User.findByIdAndUpdate(_id, { role: RoleEnum.ADMIN, company: company._id })
    res.status(200).json({ message: "Company created successfully" });
}
/**
 * Updates an existing company based on the logged-in user's credentials.
 *
 * @async
 * @function updateCompanyService
 * @api /company/update-company/:emailOfCompany
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the company update.
 * @throws {Error} - Throws an error if the company is not found, the user lacks authorization, or validation fails.
 *
 * @description
 * - Finds the company based on the logged-in user's created companies and the provided company email.
 * - Updates company details if provided in the request body.
 * - Validates and assigns new HR representatives if provided.
 * - Validates and assigns new employees if provided.
 * - Uploads and updates media files (logo, cover picture) if provided.
 * - Saves the updated company data and responds with a success message.
 */
export const updateCompanyService = async (req, res) => {
    let { companyName, description, industry, address, numberOfEmployees, companyEmail, HRs, employee } = req.body;
    const { _id } = req.loggedInUser;
    const { emailOfCompany } = req.params;
    const { files } = req;

    const company = await Company.findOne({ createdBy: _id, companyEmail: emailOfCompany });
    if (!company) {
        return res.status(400).json({ message: "Company not found or Invalid credentials" });
    }

    if (companyName) company.companyName = companyName
    if (description) company.description = description
    if (industry) company.industry = industry
    if (address) company.address = address
    if (numberOfEmployees) company.numberOfEmployees = numberOfEmployees
    if (companyEmail) company.companyEmail = companyEmail;


    if (HRs?.length || HRs) {
        HRs = Array.isArray(HRs) ? HRs : [HRs];

        const isUsers = await User.find({ _id: { $in: HRs } });
        if (!isUsers.length || isUsers.length != HRs?.length) return res.status(401).json({ message: "Not valid users" });
        const newHRs = HRs.filter(hrId => !company.HRs.includes(hrId));
        company.HRs = [...company.HRs, ...newHRs];

        for (const userId of HRs) {
            await User.findByIdAndUpdate(userId, { company: company._id, role: RoleEnum.ADMIN })
        }
    }

    if (employee?.length || employee) {
        employee = Array.isArray(employee) ? employee : [employee];

        const isUsers = await User.find({ _id: { $in: employee } });
        if (!isUsers.length || isUsers.length != employee?.length) return res.status(401).json({ message: "Not valid users" });
        const newemployee = employee.filter(hrId => !company.employee.includes(hrId));
        company.employee = [...company.employee, ...newemployee];

        for (const userId of HRs) {
            await User.findByIdAndUpdate(userId, { company: company._id })
        }
    }

    const folderName = company.mediaCloudFolder || (company.mediaCloudFolder = nanoid(4));
    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Company/${folderName}`;

    company.logo = await uploadToCloudinary(files?.logo?.[0]?.path, `${baseFolder}/Logo`) || company.logo;
    company.coverPic = await uploadToCloudinary(files?.coverPic?.[0]?.path, `${baseFolder}/Cover`) || company.coverPic;

    await company.save();
    res.status(200).json({ message: "Company updated successfully" });
}
/**
 * Soft deletes a company by marking it as deleted instead of permanently removing it.
 * 
 * @async
 * @function softDeleteCompanyService
 * @api /company//soft-delete-company/:emailOfCompany
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.emailOfCompany - The email of the company to be soft deleted.
 * @param {Object} req.loggedInUser - Object containing logged-in user details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user attempting deletion.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the soft deletion.
 * @throws {Error} - Throws an error if the company is not found or user lacks proper credentials.
 * 
 * @description
 * - Finds and updates the company to set `isDeleted` to `true`, storing the deletion timestamp.
 * - Only allows deletion if the user is the **creator** or **HR** of the company.
 * - Updates associated users (except the creator) by unassigning them from the company.
 * - Downgrades affected users' roles to **USER** and updates their credential change timestamp.
 * - Responds with a success message upon completion.
 */
export const softDeleteCompanyService = async (req, res) => {
    const { emailOfCompany } = req.params;
    const { _id } = req.loggedInUser;

    const company = await Company.findOneAndUpdate({
        companyEmail: emailOfCompany,
        $or: [{ createdBy: _id }, { HRs: _id }]
    }, { isDeleted: true, deletedAt: new Date(), updatedBy: _id }, { new: true });

    if (!company) return res.status(400).json({ message: "Company not found or Invalid credentials" });

    await User.updateMany({ company: company._id, _id: { $ne: company.createdBy } }, { $unset: { company: "" }, role: RoleEnum.USER, changeCredentialTime: new Date() });
    res.status(200).json({ message: "Company soft deleted successfully" });
}
export const deleteCompanyService= async (req, res) => {
    const { emailOfCompany } = req.params;
    const { _id } = req.loggedInUser;
    const company = await Company.findOneAndDelete({
        companyEmail: emailOfCompany,
        createdBy: _id
    });
    if (!company) return res.status(400).json({ message: "Company not found or Invalid credentials" });
    res.status(200).json({ message: "Company deleted successfully" });
}
/**
 * Retrieves company details along with its associated jobs.
 *
 * @async
 * @function getCompanyService
 * @api /company/get-company/:companyId
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.companyId - The ID of the company to retrieve.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response containing company details.
 * @throws {Error} - Returns an error if the company is not found.
 * 
 * @description
 * - Fetches a company by its ID from the database.
 * - Populates the related "Jobs" field to include job details.
 * - Excludes unnecessary fields (`isDeleted`, `createdAt`, `updatedAt`, `deletedAt`, `__v`).
 * - Responds with the company data if found, or an error if not found.
 */
export const getCompanyService = async (req, res) => {
    const { companyId } = req.params
    const company = await Company.findById(companyId).populate("Jobs").select("-isDeleted -createdAt -updatedAt -deletedAt -__v");
    if (!company) return res.status(400).json({ message: "Company not found" });
    res.status(200).json({ message: "Fetched company data successfully", company });
}
/**
 * Retrieves company details by its name.
 *
 * @async
 * @function getCompanyByNameService
 * @api  /company/get-company-name/:companyName
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.companyName - The name of the company to retrieve.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response containing company details.
 * @throws {Error} - Returns an error if the company is not found.
 *
 * @description
 * - Finds a company in the database by its name.
 * - Excludes unnecessary fields (`isDeleted`, `createdAt`, `updatedAt`, `deletedAt`, `__v`).
 * - Returns the company data if found; otherwise, responds with an error.
 */
export const getCompanyByNameService = async (req, res) => {
    const { companyName } = req.params;
    const company = await Company.findOne({ companyName }).select("-isDeleted -createdAt -updatedAt -deletedAt -__v");
    if (!company) return res.status(400).json({ message: "Company not found" });

    res.status(200).json({ message: "Fetched company data successfully", company });
}
/**
 * Updates the logo of a company by uploading the provided file to Cloudinary.
 *
 * @async
 * @function updateCompanyLogoService
 * @api  /company/update-logo/:emailOfCompany
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.emailOfCompany - The email of the company whose logo is being updated.
 * @param {Object} req.loggedInUser - Object containing the logged-in user's details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user.
 * @param {Object} req.file - The uploaded file object containing the logo image.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the update or reporting an error.
 * @throws {Error} - Throws an error if no file is uploaded, the company is not found, or the user lacks proper credentials.
 *
 * @description
 * - Validates if a file is uploaded; otherwise, responds with an error.
 * - Finds the company by email and verifies that the user is authorized (either the creator or an HR).
 * - Generates or retrieves the company's Cloudinary media folder.
 * - Uploads the new logo to Cloudinary.
 * - Saves the updated company details and responds with a success message.
 */
export const updateCompanyLogoService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { emailOfCompany } = req.params;
    const { file } = req;

    if (!file) return res.status(401).json({ message: "No file uploaded" })
    const company = await Company.findOne({
        companyEmail: emailOfCompany,
        $or: [{ createdBy: _id }, { HRs: _id }],
    })
    if (!company) return res.status(400).json({ message: "Company not found or Invalid credentials" });

    const folderName = company.mediaCloudFolder || (company.mediaCloudFolder = nanoid(4));

    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Company/${folderName}`;
    company.logo = await uploadToCloudinary(file.path, `${baseFolder}/Logo`)
    await company.save();
    res.status(200).json({ message: "Company logo updated successfully" });

}
/**
 * Updates the cover picture of a company by uploading the provided file to Cloudinary.
 *
 * @async
 * @function updateCompanyCoverService
 * @api {PUT} /company/update-cover/:emailOfCompany
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.emailOfCompany - The email of the company whose cover picture is being updated.
 * @param {Object} req.loggedInUser - Object containing the logged-in user's details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user.
 * @param {Object} req.file - The uploaded file object containing the cover image.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the update or reporting an error.
 * @throws {Error} - Throws an error if no file is uploaded, the company is not found, or the user lacks proper credentials.
 *
 * @description
 * - Validates if a file is uploaded; otherwise, responds with an error.
 * - Finds the company by email and verifies that the user is authorized (either the creator or an HR).
 * - Generates or retrieves the company's Cloudinary media folder.
 * - Uploads the new cover picture to Cloudinary.
 * - Saves the updated company details and responds with a success message.
 */
export const updateCompanyCoverService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { emailOfCompany } = req.params;
    const { file } = req;

    if (!file) return res.status(401).json({ message: "No file uploaded" })
    const company = await Company.findOne({
        companyEmail: emailOfCompany,
        $or: [{ createdBy: _id }, { HRs: _id }],
    })
    if (!company) return res.status(400).json({ message: "Company not found or Invalid credentials" });

    const folderName = company.mediaCloudFolder || (company.mediaCloudFolder = nanoid(4));

    const baseFolder = `${process.env.CLOUDINARY_FOLDER}/Company/${folderName}`;
    company.coverPic = await uploadToCloudinary(file.path, `${baseFolder}/Cover`)
    await company.save();
    res.status(200).json({ message: "Company cover updated successfully" });

}
/**
 * Deletes a company's logo by removing its reference from the database and deleting it from Cloudinary.
 *
 * @async
 * @function deleteCompanyLogoService
 * @api/company/delete-logo/:emailOfCompany
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.emailOfCompany - The email of the company whose logo is being deleted.
 * @param {Object} req.loggedInUser - Object containing the logged-in user's details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user attempting deletion.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the deletion or reporting an error.
 * @throws {Error} - Throws an error if the company is not found or the user lacks proper credentials.
 *
 * @description
 * - Validates that the user is authorized to delete the company's logo (**must be the creator or HR**).
 * - Removes the logo reference from the database using `$unset`.
 * - Deletes the logo file from Cloudinary.
 * - Returns a success response upon successful deletion.
 */
export const deleteCompanyLogoService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { emailOfCompany: companyEmail } = req.params;

    const company = await Company.findOneAndUpdate({
        companyEmail,
        $or: [{ createdBy: _id }, { HRs: _id }],
    }, { $unset: { logo: "" } }, { new: true });

    if (!company) return res.status(400).json({ message: "Company not found or Invalid credentials" });
    await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Company/${company?.mediaCloudFolder}/Logo`)
    res.status(200).json({ message: "Company logo deleted successfully" });
}
/**
 * Deletes a company's cover image by removing its reference from the database and deleting it from Cloudinary.
 *
 * @async
 * @function deleteCompanyCoverService
 * @api /company/delete-cover/:emailOfCompany
 * @param {Object} req - Express request object.
 * @param {Object} req.params - Parameters from the request.
 * @param {string} req.params.emailOfCompany - The email of the company whose cover image is being deleted.
 * @param {Object} req.loggedInUser - Object containing the logged-in user's details.
 * @param {string} req.loggedInUser._id - The ID of the logged-in user attempting deletion.
 * @param {Object} res - Express response object.
 * @returns {Promise<Response>} - JSON response confirming the deletion or reporting an error.
 * @throws {Error} - Throws an error if the company is not found or the user lacks proper credentials.
 *
 * @description
 * - Ensures the user is authorized to delete the company's cover (**must be the creator or HR**).
 * - Removes the cover image reference from the database using `$unset`.
 * - Deletes the cover image from Cloudinary.
 * - Returns a success response upon successful deletion.
 */
export const deleteCompanyCoverService = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { emailOfCompany: companyEmail } = req.params;

    const company = await Company.findOneAndUpdate({
        companyEmail,
        $or: [{ createdBy: _id }, { HRs: _id }],
    }, { $unset: { coverPic: "" } }, { new: true });

    if (!company) return res.status(400).json({ message: "Company not found or Invalid credentials" });
    await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Company/${company?.mediaCloudFolder}/Cover`)
    res.status(200).json({ message: "Company cover deleted successfully" });
}