import nodemailer from 'nodemailer';

let transporter = null;
let isMock = false;

// Create transporter helper
const getTransporter = async () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    // Configured Gmail SMTP
    console.log(`[Email] Configuring Gmail SMTP for ${emailUser}...`);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    isMock = false;
  } else {
    // Fallback Ethereal Mail Simulator
    console.log('[Email] EMAIL_USER/EMAIL_PASS not configured in environment. Generating temporary Ethereal Mail Account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      isMock = true;
      console.log(`[Email] Temporary Ethereal account configured: User: ${testAccount.user}`);
    } catch (error) {
      console.error('[Email] Failed to create Ethereal test account, setting up local console fallback:', error);
      // Hard fallback to safe mock object
      transporter = {
        sendMail: async (options) => {
          console.log(`[Email Mock Send] To: ${options.to}, Subject: ${options.subject}`);
          return { messageId: 'mock-id-' + Date.now(), mock: true };
        }
      };
      isMock = true;
    }
  }

  return transporter;
};

/**
 * Sends an email using the active transporter.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]
 */
export const sendMail = async ({ to, subject, html, text, attachments }) => {
  try {
    const activeTransporter = await getTransporter();
    const fromAddress = process.env.EMAIL_USER 
      ? `"The Golden Tooth" <${process.env.EMAIL_USER}>` 
      : '"The Golden Tooth" <no-reply@thegoldentooth.com>';

    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
      attachments
    });

    console.log(`[Email Sent] Message ID: ${info.messageId} to ${to}`);
    
    // If it's a test/mock account, print the Ethereal message link
    if (isMock && info.messageId && !info.mock) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email Test Preview] View Message at: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl };
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send to ${to}:`, error);
    return { success: false, error: error.message };
  }
};

export default sendMail;
