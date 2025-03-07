import mongoose from "mongoose";
import { GenderEnum, OtpEnum, ProviderEnum, RoleEnum } from "../../Constants/constants.js";
import { Decryption, Encryption, Hash } from "../../Utils/encryption_hash.utils.js";
import Company from "./company.model.js";
import Application from "./application.model.js";
import { cloudinary } from "../../Config/cloudinary.config.js";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    age: String,
    provider: {
        type: String,
        enum: Object.values(ProviderEnum),
        default: ProviderEnum.SYSTEM
    },
    gender: {
        type: String,
        enum: Object.values(GenderEnum),
        default: GenderEnum.NOT_SPECIFIED
    },
    DOB: {
        type: Date,
        validate: {
            validator: function (value) {
                const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                return age >= 18;
            },
            message: "User must be at least 18 years old.",
        },
    },
    mobileNumber: String,
    role: {
        type: String,
        enum: Object.values(RoleEnum),
        default: RoleEnum.USER
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company"
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    isDeleted: { type: Boolean, default: false },
    bannedAt: Date,
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    changeCredentialTime: Date,
    profilePic: {
        public_id: String,
        secure_url: String
    },
    coverPic: {
        public_id: String,
        secure_url: String
    },
    mediaCloudFolder: String,
    OTP: [{
        code: { type: String, requiredd: true }, // Should be hashed before storing
        type: { type: String, enum: Object.values(OtpEnum), requiredd: true },
        expiresIn: { type: Date, requiredd: true },
    },]

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })

userSchema.virtual("userName").get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await Hash({ value: this.password })
    }
    if (this.isModified("mobileNumber")) {
        this.mobileNumber = await Encryption({ value: this.mobileNumber })
    }
    next();
});

// userSchema.post("findOne", async function (doc, next) {
//     if (doc && doc?.MobileNumber) {
//         try {
//             doc.MobileNumber = await Decryption({ cipher: doc.MobileNumber });
//         } catch (error) {
//             console.error("Error decrypting MobileNumber:", error);
//         }
//     }
//     next();
// });
userSchema.post(/^find/, async function (docs) {
    if (!Array.isArray(docs)) docs = [docs];

    for (const doc of docs) {
        if (doc?.mobileNumber) {
            doc.mobileNumber = await Decryption({ cipher: doc?.mobileNumber });
        }
    }
});

userSchema.pre(/^find/, function (next) {
    this.where({ isDeleted: false });
    next();
});
//application company(employee hrs)
userSchema.post("findOneAndDelete", async function (doc, next) {

    if (doc?.company) {
        await Company.findByIdAndUpdate(doc?.company, { $pull: { employee: doc._id, HRs: doc._id } })
    }
    await Application.findOneAndDelete({ userId: doc._id })

    if (doc?.mediaCloudFolder) {
        await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Users/${doc?.mediaCloudFolder}/Cover`)
        await cloudinary().api.delete_resources_by_prefix(`${process.env.CLOUDINARY_FOLDER}/Users/${doc?.mediaCloudFolder}/Profile`)
        await cloudinary().api.delete_folder(`${process.env.CLOUDINARY_FOLDER}/Users/${doc?.mediaCloudFolder}`)
    }
    next();
});

const User = mongoose.model.User || mongoose.model("User", userSchema);
export default User;
