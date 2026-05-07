import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_USER = process.env.EMAIL_USER;

console.log('--- Brevo Email Test ---');
console.log('API Key (first 20 chars):', BREVO_API_KEY ? BREVO_API_KEY.substring(0, 20) + '...' : 'MISSING!');
console.log('Sender Email:', EMAIL_USER || 'MISSING!');

if (!BREVO_API_KEY) {
  console.error('ERROR: BREVO_API_KEY is not set in .env');
  process.exit(1);
}
if (!EMAIL_USER) {
  console.error('ERROR: EMAIL_USER is not set in .env');
  process.exit(1);
}

const payload = {
  sender: { name: "AetherTracker Test", email: EMAIL_USER },
  to: [{ email: EMAIL_USER, name: "Test User" }],
  subject: "[AetherTracker] Test Email - Brevo Integration",
  htmlContent: `
    <html>
    <body style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h1 style="color: #F5840B; font-size: 20px;">AetherTracker Email Test ✅</h1>
        <p>If you are reading this, the Brevo email integration is working correctly!</p>
        <p style="color: #64748b; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      </div>
    </body>
    </html>
  `
};

console.log('\nSending test email to:', EMAIL_USER);

try {
  const response = await axios.post(BREVO_API_URL, payload, {
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  });

  console.log('\n✅ SUCCESS! Email sent.');
  console.log('Message ID:', response.data.messageId);
  console.log('Check your inbox at:', EMAIL_USER);
} catch (error) {
  console.error('\n❌ FAILED! Brevo API Error:');
  console.error('Status:', error.response?.status);
  console.error('Message:', JSON.stringify(error.response?.data || error.message, null, 2));
}
