import mongoose from "mongoose";
import { JobLocationEnum, SeniorityLevelEnum, WorkingTimeEnum } from "../../Constants/constants.js";
import Application from "./application.model.js";

const jobOpportunitySchema = new mongoose.Schema({
    jobTitle: {
        type: String,
        required: true,
    },
    jobLocation: {
        type: String,
        required: true,
        enum: Object.values(JobLocationEnum),
    },
    workingTime: {
        type: String,
        required: true,
        enum: Object.values(WorkingTimeEnum),
    },
    seniorityLevel: {
        type: String,
        required: true,
        enum: Object.values(SeniorityLevelEnum),
    },
    jobDescription: {
        type: String,
        required: true,
    },
    technicalSkills: {
        type: [String],
        required: true,
    },
    softSkills: {
        type: [String],
        required: true,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    closed: {
        type: Boolean,
        default: false,
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

jobOpportunitySchema.post("findOneAndDelete", async function (doc, next) {
    // console.log(doc);

    await Application.deleteMany({ jobId: doc?._id })
    next();
});
jobOpportunitySchema.pre("deleteMany", async function (next) {
    const jobsToDelete = await this.model.find(this.getQuery()); // Get the documents before deleting
    this.deletedDocs = jobsToDelete; // Store them for post middleware
    next();
});

jobOpportunitySchema.post("deleteMany", async function () {
    if (this.deletedDocs?.length) {
        const jobIds = this.deletedDocs.map(job => job._id); // Extract job IDs
        await Application.deleteMany({ jobId: { $in: jobIds } });
    }
});

const JobOpportunity = mongoose.model.JobOpportunity || mongoose.model('JobOpportunity', jobOpportunitySchema);

export default JobOpportunity;
