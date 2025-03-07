import mongoose from "mongoose";

const blackLstTokenSchema = new mongoose.Schema({
    tokenId: {
        type: String,
        required: true,
        unique: true
    },
    expierdAt: {
        type: String,
        required: true
    }

}, { timestamps: true });
const BlackListTokens = mongoose.model.BlackListTokens || mongoose.model('BlackListTokens', blackLstTokenSchema)
export default BlackListTokens;