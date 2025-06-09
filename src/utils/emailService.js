const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - MediLink',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your MediLink account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendAppointmentEmail = async (appointment, type) => {
  const { doctor, patient, date, timeSlot, status } = appointment;
  
  let subject, html;
  const formattedDate = new Date(date).toLocaleDateString();
  
  switch (type) {
    case 'confirmation':
      subject = 'Appointment Confirmation - MediLink';
      html = `
        <h1>Appointment Confirmation</h1>
        <p>Your appointment has been scheduled:</p>
        <ul>
          <li>Date: ${formattedDate}</li>
          <li>Time: ${timeSlot.start} - ${timeSlot.end}</li>
          <li>Doctor: ${doctor.name}</li>
          <li>Patient: ${patient.name}</li>
        </ul>
        <p>You will receive a reminder 24 hours before your appointment.</p>
      `;
      break;
      
    case 'status-update':
      subject = 'Appointment Status Update - MediLink';
      html = `
        <h1>Appointment Status Update</h1>
        <p>Your appointment status has been updated:</p>
        <ul>
          <li>Date: ${formattedDate}</li>
          <li>Time: ${timeSlot.start} - ${timeSlot.end}</li>
          <li>Doctor: ${doctor.name}</li>
          <li>Patient: ${patient.name}</li>
          <li>New Status: ${status}</li>
        </ul>
      `;
      break;
      
    case 'reminder':
      subject = 'Appointment Reminder - MediLink';
      html = `
        <h1>Appointment Reminder</h1>
        <p>This is a reminder for your upcoming appointment:</p>
        <ul>
          <li>Date: ${formattedDate}</li>
          <li>Time: ${timeSlot.start} - ${timeSlot.end}</li>
          <li>Doctor: ${doctor.name}</li>
          <li>Patient: ${patient.name}</li>
        </ul>
        <p>Please arrive 10 minutes before your scheduled time.</p>
      `;
      break;
      
    default:
      return false;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [doctor.email, patient.email],
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending appointment email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendAppointmentEmail
}; 