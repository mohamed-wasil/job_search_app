import nodemailer from "nodemailer"
import { EventEmitter } from "node:events";
/**
 * Sends an email using Nodemailer.
 * @async
 * @function sedEmailService
 * @param {Object} options - Email sending options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content of the email
 * @param {Object[]} [options.attachments] - Array of attachments for the email
 * @returns {Promise<Object>} - Information about the sent email
 * @throws {Error} - Throws an error if email sending fails
 * @description 
 * - Uses `nodemailer.createTransport` to configure the email sender.
 * - Sends an email using SMTP with the provided details.
 * - Returns the email sending result from Nodemailer.
 */

const sedEmailService = async ({ to, subject, html, attachments }) => {
    const transporter = nodemailer.createTransport({
        host:'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const info = await transporter.sendMail({
        from: `"Job Search App 👻" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments
    })
    return info
}

/**
 * Listens for the "sendEmail" event and triggers the email sending service.
 * @event sendEmail
 * @param {Object} args - Email sending parameters
 * @param {string} args.to - Recipient email address
 * @param {string} args.subject - Email subject line
 * @param {string} args.html - HTML content of the email
 * @param {Object[]} [args.attachments] - Optional array of email attachments
 * @returns {void} - No return value; logs a message after triggering the email service
 * @description
 * - Listens for the `"sendEmail"` event.
 * - Extracts email details from the event payload.
 * - Calls `sedEmailService` to send the email.
 * - Logs `"Email Sending..."` to indicate that the email process has started.
 */

const sendEmail = new EventEmitter();
sendEmail.on("sendEmail", ({ ...args }) => {
    const { to, subject, html, attachments } = args

    sedEmailService({ to, subject, html, attachments })
    console.log("Email Sending...");
})
export default sendEmail