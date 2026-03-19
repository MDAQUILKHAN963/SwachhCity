import twilio from 'twilio';

const {
  SMS_PROVIDER = 'twilio',
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
} = process.env;

let twilioClient = null;

if (SMS_PROVIDER === 'twilio' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ SMS service (Twilio) initialized');
  } catch (err) {
    console.error('Failed to initialize Twilio client:', err.message);
  }
} else {
  console.log('ℹ️ SMS service not fully configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER to enable SMS.');
}

const isSmsEnabled = () => {
  return !!twilioClient;
};

const safeSend = async (to, body) => {
  if (!isSmsEnabled()) {
    console.log(`[SMS Disabled] Would send to ${to}: ${body}`);
    return { success: false, disabled: true };
  }

  try {
    const message = await twilioClient.messages.create({
      from: TWILIO_FROM_NUMBER,
      to,
      body,
    });
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS send error:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendComplaintCreated = async (user, complaint) => {
  if (!user?.phone) return { success: false, reason: 'no_phone' };

  const body = `SwachhCity: Your complaint #${String(complaint._id).slice(-6)} has been registered at ${complaint.address}. We will assign a worker soon.`;
  return safeSend(user.phone, body);
};

export const sendWorkerAssigned = async (workerUser, complaint) => {
  if (!workerUser?.phone) return { success: false, reason: 'no_phone' };

  const body = `SwachhCity: New assignment #${String(complaint._id).slice(-6)} at ${complaint.address}. Severity ${complaint.severity}/10. Please attend within SLA.`;
  return safeSend(workerUser.phone, body);
};

export const sendStatusUpdated = async (user, complaint) => {
  if (!user?.phone) return { success: false, reason: 'no_phone' };

  const body =
    complaint.status === 'resolved'
      ? `SwachhCity: Your complaint #${String(complaint._id).slice(-6)} has been resolved. Thank you for keeping the city clean.`
      : `SwachhCity: Status of your complaint #${String(complaint._id).slice(-6)} changed to ${complaint.status}.`;

  return safeSend(user.phone, body);
};

export default {
  sendComplaintCreated,
  sendWorkerAssigned,
  sendStatusUpdated,
};

