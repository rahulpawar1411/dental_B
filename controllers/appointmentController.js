import path from 'path';
import { readData, writeData } from '../utils/db.js';
import { sendMail } from '../utils/emailService.js';

export const appointmentController = {
  /**
   * Retrieves all appointments
   */
  getAppointments: async (req, res) => {
    try {
      const appointments = await readData('appointments');
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve appointments' });
    }
  },

  /**
   * Creates a new appointment
   */
  createAppointment: async (req, res) => {
    const { name, email, phone, treatment, preferredDate, preferredTime, message } = req.body;
    
    // Server-side validation
    const errors = {};
    if (!name || name.trim().length < 3) {
      errors.name = 'Full name is required (min 3 characters)';
    }

    if (!email || !/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!phone || !/^\+?[0-9\s-]{10,15}$/.test(phone.replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid phone number (min 10 digits)';
    }

    if (!treatment) {
      errors.treatment = 'Please select a dental service';
    }

    if (!preferredDate) {
      errors.preferredDate = 'Please select a date';
    } else {
      const selected = new Date(preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.preferredDate = 'Preferred date must be in the future';
      }
    }

    if (!preferredTime) {
      errors.preferredTime = 'Please select a preferred time slot';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      const appointments = await readData('appointments');
      
      const newAppointment = {
        id: 'apt_' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        treatment,
        preferredDate,
        preferredTime,
        message: message ? message.trim() : '',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      appointments.push(newAppointment);
      await writeData('appointments', appointments);
      
      // Send confirmation emails in background (non-blocking for fast UI response)
      const clinicEmail = process.env.CLINIC_EMAIL || process.env.EMAIL_USER || 'info@thegoldentooth.com';
      const siteUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const logoPath = path.join(process.cwd(), 'assets/logo.png');
      const mailAttachments = [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'logo'
      }];
      
      // Patient confirmation HTML template
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
          
          <h3 style="color: #0f172a; margin-top: 0; font-size: 18px;">Appointment Confirmed</h3>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Dear <strong>${newAppointment.name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your dental appointment has been successfully secured. Below are your appointment details:</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr style="border-bottom: 1px solid #edf2f7;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Treatment:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${newAppointment.treatment}</td>
              </tr>
              <tr style="border-bottom: 1px solid #edf2f7;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Preferred Date:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${newAppointment.preferredDate}</td>
              </tr>
              <tr style="border-bottom: 1px solid #edf2f7;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Time Slot:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${newAppointment.preferredTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Confirmation ID:</td>
                <td style="padding: 8px 0; color: #0e7490; font-weight: 700; font-family: monospace;">${newAppointment.id}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="color: #b45309; margin: 0; font-size: 13px; font-weight: 500; line-height: 1.5;">
              <strong>Important Instructions:</strong><br/>
              • Please arrive 10 minutes prior to your scheduled slot.<br/>
              • If you need to cancel or reschedule, please call us at least 24 hours in advance.
            </p>
          </div>
          
          <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            <strong>Clinic Location:</strong> Shop no5, Anandi Niwas, opp. Twinkle Towers, opp. HIGHLAND PARK, Yashaswi Nagar, Dhokali, Thane West, Thane, Maharashtra 400607<br/>
            <strong>Direct Phone:</strong> +91 98765 43210 | <strong>Email:</strong> ${clinicEmail} | <strong>Website:</strong> <a href="${siteUrl}" target="_blank" style="color: #0e7490; text-decoration: none; font-weight: 600;">www.thegoldentooth.com</a>
          </div>
        </div>
      `;

      // Admin Alert HTML template
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0e7490; margin-top: 0;">New Appointment Alert</h2>
          <p>A new appointment has been scheduled through the website booking portal.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tr><td style="padding: 6px 0; font-weight: bold; width: 150px;">Patient Name:</td><td style="padding: 6px 0;">${newAppointment.name}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Email Address:</td><td style="padding: 6px 0;"><a href="mailto:${newAppointment.email}">${newAppointment.email}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Phone Number:</td><td style="padding: 6px 0;"><a href="tel:${newAppointment.phone}">${newAppointment.phone}</a></td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Dental Service:</td><td style="padding: 6px 0; font-weight: bold; color: #0e7490;">${newAppointment.treatment}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Appointment Date:</td><td style="padding: 6px 0;">${newAppointment.preferredDate}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Selected Slot:</td><td style="padding: 6px 0;">${newAppointment.preferredTime}</td></tr>
            <tr><td style="padding: 6px 0; font-weight: bold;">Notes/Message:</td><td style="padding: 6px 0; font-style: italic;">${newAppointment.message || 'No notes provided'}</td></tr>
          </table>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Received on: ${newAppointment.createdAt}
          </div>
        </div>
      `;

      // Await email dispatch (critical for Serverless environments like Vercel to prevent process termination)
      try {
        await Promise.all([
          sendMail({
            to: newAppointment.email,
            subject: `Appointment Confirmed: ${newAppointment.treatment} - The Golden Tooth`,
            html: patientHtml,
            attachments: mailAttachments
          }),
          sendMail({
            to: clinicEmail,
            subject: `[New Appointment Alert] ${newAppointment.name} - ${newAppointment.treatment}`,
            html: adminHtml
          })
        ]);
      } catch (err) {
        console.error('[Email Dispatch Error] Failed to send emails:', err);
      }
 
      res.status(201).json({
        success: true,
        appointment: newAppointment
      });
    } catch (error) {
      console.error('Failed to create appointment:', error);
      res.status(500).json({ 
        success: false, 
        errors: { global: 'Internal server error. Failed to save appointment.' } 
      });
    }
  }
};
export default appointmentController;
