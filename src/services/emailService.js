// Email service using nodemailer
const nodemailer = require('nodemailer');

let cachedTransporter = null;
const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  // No SMTP config provided — create an Ethereal test account for development/tests
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return cachedTransporter;
};

exports.sendRegistrationEmail = async (userEmail, eventData) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@airtribe.com',
    to: userEmail,
    subject: 'Event Registration Confirmation',
    text: `You are registered for ${eventData.title} at ${eventData.dateTime}`,
  });

  // For Ethereal transport, log preview URL
  if (nodemailer.getTestMessageUrl && info) {
    // eslint-disable-next-line no-console
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
  return info;
};
