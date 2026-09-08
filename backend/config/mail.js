const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },

    tls: {
        rejectUnauthorized: false,
    },
});


const sendEmail = async (to, subject, text, html) => {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text,
        html: html,
    };

    await transporter.sendMail(mailOptions);
};


module.exports = sendEmail;