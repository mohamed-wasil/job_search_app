import { authenticationMiddleware } from "../Middlewares/authentication.middleware.js";
import { sendMessageService } from "../modules/User/Services/chat.service.js";

export const socketConnection = new Map()

/**
 * Registers a socket connection ID for an authenticated user.
 * @async
 * @function registerSocketId
 * @param {Object} handshake - The socket handshake object containing authentication data
 * @param {string} id - The socket connection ID to be registered
 * @returns {Promise<string>} - A success message confirming socket connection
 * @throws {Error} - Throws an error if authentication fails
 * @description 
 * - Extracts the access token from `handshake.auth.accesstoken`.
 * - Authenticates the user using `authenticationMiddleware`.
 * - Stores the user's ID and associated socket ID in `socketConnection`.
 * - Logs a message confirming the socket connection.
 */

export const registerSocketId = async (handshake, id) => {
    const accessToken = handshake.auth.accesstoken
    const user = await authenticationMiddleware(accessToken)
    socketConnection.set(user?._id?.toString(), id)
    console.log("Socket Connected");
    return "socket connected successfully"
}
/**
 * Removes a user's socket connection when they disconnect.
 * @async
 * @function removeSocket
 * @param {Object} socket - The socket instance to monitor for disconnection
 * @returns {Promise<void>} - No return value; logs and removes the socket connection
 * @throws {Error} - Throws an error if authentication fails
 * @description 
 * - Listens for the `"disconnect"` event on the provided socket.
 * - Extracts the access token from `socket.handshake.auth.accesstoken`.
 * - Authenticates the user using `authenticationMiddleware`.
 * - Removes the user's socket ID from `socketConnection` upon disconnection.
 * - Logs a message confirming the socket disconnection.
 */

export const removeSocket = async (socket) => {
    return socket.on("disconnect", async () => {
        const accessToken = socket.handshake.auth.accesstoken
        const user = await authenticationMiddleware(accessToken)
        socketConnection.delete(user?._id?.toString())
        console.log("Socket disConnected");
        return "disConnected"
    })
}

// export const applicationSubm
/**
 * @function establishIoConnection
 * @description Establishes a Socket.IO connection and registers necessary event listeners.
 * @param {Object} io - The Socket.IO server instance.
 * @returns {void}
 * 
 * @listens connection - Listens for new client connections.
 * 
 * @async
 * @callback socketCallback
 * @param {Object} socket - The connected Socket.IO client instance.
 * @param {Object} socket.handshake - Handshake data containing authentication details.
 * @param {string} socket.id - Unique socket ID for the connected client.
 * 
 * @throws {Error} - Logs errors if any function (`registerSocketId`, `sendMessageService`, `removeSocket`, `deleteChatAfter24Hour`) fails.
 **/

export const establishIoConnection = (io) => {
    return io.on("connection", async (socket) => {
        await registerSocketId(socket.handshake, socket.id)
        await sendMessageService(socket)
        await removeSocket(socket)
       await deleteChatAfter24Hour(socket)

    })
}
