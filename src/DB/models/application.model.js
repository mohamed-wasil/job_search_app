import mongoose from "mongoose";
import { ApplicationStatusEnum } from "../../Constants/constants.js";

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobOpportunity',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userCV: {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
    },
    status: {
        type: String,
        enum: Object.values(ApplicationStatusEnum),
        default: ApplicationStatusEnum.PENDING
    },
    appliedAt: Date,
}, {
    timestamps: true,
});

const Application = mongoose.model.Application || mongoose.model('Application', applicationSchema);
export default Application;