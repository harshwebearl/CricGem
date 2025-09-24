const nodemailer = require('nodemailer');
require('dotenv')

async function sendEmail(email, subject, text) {
    try {
        // Create a transporter object
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,// true for 465 (SSL), false for 587 (TLS)
            auth: {
                user: 'rakeshparmar.webearl@gmail.com',
                pass: process.env.PASSWORD,
            },
        });

        // Define the email options
        const mailOptions = {
            from: '"Rakesh Parmar" <rakeshparmar.webearl@gmail.com>',
            to: email,
            subject: subject,
            text: text, // Plain text body
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

    } catch (error) {
        console.error('Failed to send email:', error.message);
    }
}


module.exports = sendEmail