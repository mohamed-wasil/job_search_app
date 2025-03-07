import mongoose from "mongoose";

const chatShema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    messages: [{
        body: {
            type: String,
            require: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId, ref: "User" ,
            require: true
        },
        sentAt: {
            type: Date, default: Date.now
        }
    }]

}, { timestamps: true })


const Chat = mongoose.model.Chat || mongoose.model("Chat", chatShema)

export default Chat