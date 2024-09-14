// Reference: https://stackoverflow.com/questions/51933601/what-is-the-definitive-way-to-use-gmail-with-oauth-and-nodemailer
// Configuration: https://developers.google.com/oauthplayground

const { google } = require('googleapis')
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')

dotenv.config()

const CLIENT_ID = process.env.EMAIL_CLIENT_ID
const CLIENT_SECRET = process.env.EMAIL_CLIENT_SECRET
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS
const REDIRECT_URI = process.env.EMAIL_REDIRECT_URI
const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
)
oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
})

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken()

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: EMAIL_ADDRESS,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken.token
            }
        })

        const mailOptions = {
            from: EMAIL_ADDRESS,
            to,
            subject,
            text,
            html
        }

        const info = await transporter.sendMail(mailOptions)
        console.log(`Email sent to ${to}: ${info.response}`)
    } catch (error) {
        console.error(`Error sending email to ${to}: ${error}`)
    }
}

module.exports = { sendEmail }
