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

const buildEmail = ({ header, firstName, description, url, linkText }) => {
    const html = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                    .button { background-color: #9E1B32; color: white !important; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
                    .footer { font-size: 12px; color: #777; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>${header}</h2>
                    <p>Hello ${firstName},</p>
                    <p>${description}</p>
                    <p><a class="button" href="${url}">${linkText}</a></p>
                    <p class="footer">If you did not request this, you can ignore this email.</p>
                </div>
            </body>
        </html>`

    const text = `Hello ${firstName},

${description}

${url}

If you did not request this, you can ignore this email.`

    return { text, html }
}

module.exports = { sendEmail, buildEmail }
