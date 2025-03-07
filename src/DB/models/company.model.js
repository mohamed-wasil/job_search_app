import mongoose from "mongoose";
import User from "./user.model.js";
import JobOpportunity from "./job-opportunity.model.js";
import { cloudinary } from "../../Config/cloudinary.config.js";
import { RoleEnum } from "../../Constants/constants.js";


const companySchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    industry: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    numberOfEmployees: {
        type: String,
        required: true,
        enum: ['1-10', '11-20', '21-50', '51-100', '101-200', '201-500', '501+'],
    },
    employee: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    companyEmail: {
        type: String,
        required: true,
        unique: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    logo: {
        secure_url: String,
        public_id: String
    },
    coverPic: {
        secure_url: String,
        public_id: String
    },
    mediaCloudFolder: String,
    HRs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    bannedAt: {
        type: Date,
    },
    deletedAt: {
        type: Date,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
    legalAttachment: {
        secure_url: String,
        public_id: String
    },
    approvedByAdmin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

companySchema.virtual("Jobs", {
    ref: "JobOpportunity",
    localField: "_id",
    foreignField: "companyId",
})
companySchema.pre(/^find/, function (next) {
    if (!this.getQuery().includeDeleted) {
        this.where({ isDeleted: false });
    }
    next();
});

//user if user there company delete it from user 
//job companyId

companySchema.post("findOneAndDelete", async function (doc, next) {

    if (doc?.employee.length) {
        await User.updateMany({ company: doc?._id }, { $unset: { company: "" }, role: RoleEnum.USER })
    }
    await JobOpportunity.deleteMany({ companyId: doc?._id })

    // await Application.findOneAndDelete({ userId: doc._id })

    if (doc?.mediaCloudFolder) {
        await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Company/${doc?.mediaCloudFolder}/Cover`)
        await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Company/${doc?.mediaCloudFolder}/logo`)
        await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Company/${doc?.mediaCloudFolder}/CVs`)
        await cloudinary().api.delete_folder(`${process.env.CLOUDINARY_FOLDER}/Company/${doc?.mediaCloudFolder}`)
    }
    next();
});
const Company = mongoose.model.Company || mongoose.model('Company', companySchema);
export default Company;
