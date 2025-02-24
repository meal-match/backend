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
    let html = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; text-align: center; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                    .header { display: flex; align-items: center; justify-content: center; gap: 10px; }
                    .logo { max-width: 50px; height: auto; }
                    .button { background-color: #9E1B32; color: white !important; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-top: 10px; }
                    .footer { font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
                    .footer a { color: #9E1B32; text-decoration: none; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img class="logo" src="${process.env.WEBSITE_URL}/assets/MealMatchLogoIcon.png" alt="Company Logo">
                        <h2>${header}</h2>
                    </div>
                    <div class="content">
                        <p>Hello ${firstName},</p>
                        <p>${description}</p>`
    if (url) {
        html += `<p><a class="button" href="${url}">${linkText}</a></p>`
    }
    html += '</div>'
    if (url) {
        html += `<p class="footer">If you did not request this, you can ignore this email.<br>
            For more information, visit our <a href="${process.env.WEBSITE_URL}">website</a>.</p>
        </div>`
    }
    html += '</body></html>'

    let text = `Hello ${firstName},

${description}`

    if (url) {
        text += `${url}

If you did not request this, you can ignore this email.

For more information, visit our website: ${process.env.WEBSITE_URL}`
    }

    return { text, html }
}

module.exports = { sendEmail, buildEmail }
