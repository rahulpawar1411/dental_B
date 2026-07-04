import path from 'path';
import { readData, writeData } from '../utils/db.js';
import { sendMail } from '../utils/emailService.js';

export const contactController = {
  /**
   * Retrieves all contact messages
   */
  getMessages: async (req, res) => {
    try {
      const messages = await readData('contacts');
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  },

  /**
   * Submits a new contact message and triggers email notifications
   */
  createMessage: async (req, res) => {
    const { name, email, subject, message } = req.body;

    // Server-side validation
    const errors = {};
    if (!name || name.trim().length < 3) {
      errors.name = 'Name is required (min 3 characters)';
    }

    if (!email || !/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!message || message.trim().length < 10) {
      errors.message = 'Please enter a message (min 10 characters)';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const messages = await readData('contacts');
      
      const newMessage = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : 'General Inquiry',
        message: message.trim(),
        createdAt: new Date().toISOString()
      };

      messages.push(newMessage);
      await writeData('contacts', messages);
      
      // Email dispatch setup
      const clinicEmail = process.env.CLINIC_EMAIL || process.env.EMAIL_USER || 'info@thegoldentooth.com';
      const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const logoPath = path.join(process.cwd(), '../frontend/src/assets/logo.png');
      const mailAttachments = [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      }];

      // Patient confirmation email template
      const patientHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px;">
            <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; display: inline-table; text-align: left; vertical-align: middle;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="cid:logo" alt="The Golden Tooth" style="height: 52px; display: block; border: none;" />
                  </td>
                  <td style="width: 1px; padding: 0; vertical-align: middle;">
                    <div style="width: 1px; height: 36px; background-color: #c5a059;"></div>
                  </td>
                  <td style="vertical-align: middle; padding-left: 12px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: left;">
                    <span style="font-size: 18px; font-weight: 800; line-height: 1.1; color: #c5a059; letter-spacing: -0.01em; display: block;">The Golden Tooth</span>
                    <span style="font-size: 11px; font-weight: 600; line-height: 1.2; color: #0f2d59; display: block; margin-top: 1px;">Multispeciality Dental clinic</span>
                  </td>
                </tr>
              </table>
            </a>
          </div>
          
          <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">Query Received</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Dear <strong>${newMessage.name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Thank you for reaching out to us. We have received your query regarding "<strong>${newMessage.subject}</strong>" and our front desk coordinator will respond to your email within the next 2 hours.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 14px; color: #475569; line-height: 1.6;">
            <strong>Your Message Summary:</strong><br/>
            <p style="margin: 5px 0 0 0; font-style: italic;">"${newMessage.message}"</p>
          </div>
          
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            <strong>Clinic Location:</strong> Shop no5, Anandi Niwas, opp. Twinkle Towers, opp. HIGHLAND PARK, Yashaswi Nagar, Dhokali, Thane West, Thane, Maharashtra 400607<br/>
            <strong>Direct Phone:</strong> +91 98765 43210 | <strong>Email:</strong> ${clinicEmail} | <strong>Website:</strong> <a href="${siteUrl}" target="_blank" style="color: #0e7490; text-decoration: none; font-weight: 600;">www.thegoldentooth.com</a>
          </div>
        </div>
      `;

      // Admin Alert Email Template
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0e7490; margin-top: 0;">New Contact Form Submission</h2>
          <p>A new visitor has submitted a contact query form on the website.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 120px;">Name:</td><td style="padding: 6px 0;">${newMessage.name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Email:</td><td style="padding: 6px 0;"><a href="mailto:${newMessage.email}">${newMessage.email}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Subject:</td><td style="padding: 6px 0; font-weight: bold; color: #0e7490;">${newMessage.subject}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Message:</td><td style="padding: 6px 0; font-style: italic; background-color: #f8fafc; padding: 10px; border-radius: 4px; border-left: 3px solid #0e7490;">${newMessage.message}</td></tr>
          </table>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Message ID: ${newMessage.id} | Received on: ${newMessage.createdAt}
          </div>
        </div>
      `;

      // Dispatch emails in background
      Promise.all([
        sendMail({
          to: newMessage.email,
          subject: `We've Received Your Query - The Golden Tooth`,
          html: patientHtml,
          attachments: mailAttachments
        }),
        sendMail({
          to: clinicEmail,
          subject: `[New Inquiry] ${newMessage.name} - ${newMessage.subject}`,
          html: adminHtml
        })
      ]).catch(err => console.error('[Contact Email Dispatch Error] Failed to send:', err));

      res.status(201).json({
        success: true,
        message: 'Your query has been sent successfully!'
      });
    } catch (error) {
      console.error('Failed to save contact query:', error);
      res.status(500).json({ 
        success: false, 
        errors: { global: 'Internal server error. Failed to save your message.' } 
      });
    }
  }
};
export default contactController;
