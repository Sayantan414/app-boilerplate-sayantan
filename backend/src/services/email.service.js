const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const config = require('../config/config');
const logger = require('../config/logger');

const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    config.email.clientId,
    config.email.clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    refresh_token: config.email.refreshToken,
  });

  try {
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) reject('Failed to create access token :(');
        resolve(token);
      });
    });

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.email.user,
        accessToken,
        clientId: config.email.clientId,
        clientSecret: config.email.clientSecret,
        refreshToken: config.email.refreshToken,
      },
    });
  } catch (error) {
    logger.error('Email transporter creation failed', error);
    throw error;
  }
};

/**
 * Send email
 * @param {Object} options { to, subject, html, fromName }
 */
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `${options.fromName || 'App'} <${config.email.user}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}`, error);
    throw error;
  }
};

module.exports = {
  sendEmail,
};
