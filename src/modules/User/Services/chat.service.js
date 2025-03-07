import Chat from "../../../DB/Models/chat.model.js";
import Company from "../../../DB/models/company.model.js";
import { authenticationMiddleware } from "../../../Middlewares/authentication.middleware.js";
import { socketConnection } from "../../../Utils/socket.utils.js";

/**
 * @function getChatServices
 * @description Retrieves the chat history between the logged-in user and a specified receiver.
 * 
 * @param {Object} req - Express request object.
 * @param {Object} req.loggedInUser - The logged-in user.
 * @param {string} req.loggedIn._id - The ID of the logged-in user.
 * @param {Object} req.params - Request parameters.
 * @param {string} req.params.receiverId - The ID of the user to fetch chat history with.
 * @param {Object} res - Express response object.
 * @returns {Object} JSON response containing the chat history.
 */

export const getChatServices = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { receiverId } = req.params;
    const chat = await Chat.findOne(
        {
            $or: [
                { senderId: _id, receiverId },
                { senderId: receiverId, receiverId: _id }
            ]
        }
    ).populate([
        {
            path: "senderId",
            select: "username profilePicture"
        },
        {
            path: "receiverId",
            select: "username profilePicture"
        },
        {
            path: "messages.senderId",
            select: "username profilePicture"
        }
    ])
    res.status(201).json({ message: "Chat history fetched successfully", chat })
}
/**
 * @function sendMessageService
 * @description Handles sending messages via a WebSocket connection, updating the chat history in the database.
 * Only HRs or company owner start chat
 * 
 * @param {Object} socket - The WebSocket connection object.
 * @returns {void} Sets up a listener for the "sendMessage" event and processes the message.
 */

export const sendMessageService = async (socket) => {
    return socket.on("sendMessage", async (data) => {
        const { body, receiverId } = data
        const loggedInUser = await authenticationMiddleware(socket.handshake.auth.accesstoken)

        let chat = await Chat.findOneAndUpdate(
            {
                $or: [
                    { senderId: loggedInUser._id, receiverId },
                    { senderId: receiverId, receiverId: loggedInUser._id }]
            },
            {
                $addToSet: {
                    messages: {
                        body,
                        senderId: loggedInUser._id
                    }
                }
            })

        if (!chat) {
            const user = await Company.findOne({ $or: [{ cretaedBy: loggedInUser._id }, { HRs: loggedInUser._id }] })
           if(!user){
            socket.emit("error", { message: "Only Hr or Company owner start chat" })
            return;
           }else{
            chat = new Chat({
                senderId: loggedInUser._id,
                receiverId,
                messages: [{
                    body,
                    senderId: loggedInUser._id
                }]
            })
            chat = await chat.save()
           }
        }
        socket.emit("successMessage", { body, chat })
        const receiverSocketId = socketConnection.get(receiverId.toString())
        socket.to(receiverSocketId).emit("receiveMessage", { body })
    })
}

export const deleteChatAfter24Hour = async (socket) => {
    return socket.on("deleteChat", async (data) => {
        const loggedInUser = await authenticationMiddleware(socket.handshake.auth.accesstoken)
        const { body, receiverId } = data

        setTimeout(async () => {
            await Chat.findOneAndDelete(
                {
                    $or: [
                        { senderId: loggedInUser._id, receiverId },
                        { senderId: receiverId, receiverId: loggedInUser._id }]
                })
            const receiverSocketId = socketConnection.get(receiverId.toString())
            const senderSocketdId = socketConnection.get(loggedInUser._id.toString())

            socket.to(receiverSocketId).emit("chatDeleted", { message: "Chat history deleted after 24 hours" });
            socket.to(senderSocketdId).emit("chatDeleted", { message: "Chat history deleted after 24 hours" });

        }, 24 * 60 * 60 * 1000);
    })

}

export const deleteChatHistoryServicve = async (req, res) => {
    const { _id } = req.loggedInUser;
    const { receiverId } = req.params;
    const chat = await Chat.findOneAndDelete(
        {
            $or: [
                { senderId: _id, receiverId },
                { senderId: receiverId, receiverId: _id }
            ]
        }
    )
    res.status(201).json({ message: "Chat history cleared" })
}