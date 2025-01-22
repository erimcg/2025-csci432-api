const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email,
        from: 'rmcgregor@bridgewater.edu',
        subject: 'Welcome to Our Community!',
        text: `Hello ${name}. We have some great things in store for you!`
    })

}

module.exports = { sendWelcomeEmail }