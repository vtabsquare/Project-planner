import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

export const sendCoordinatorEmail = async (coordinator, project, tasks = []) => {
  if (!BREVO_API_KEY) {
    console.error('BREVO_API_KEY is missing in environment variables');
    return;
  }

  const otherCoordinators = project.coordinators
    .filter(c => c.email !== coordinator.email)
    .map(c => c.name)
    .join(', ') || 'None assigned yet';

  const taskListHtml = tasks.length > 0
    ? tasks.map(t => `
        <div style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
          <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${t.name}</div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Priority: ${t.priority || 'Medium'}</div>
        </div>
      `).join('')
    : '<div style="font-size: 12px; color: #94a3b8; font-style: italic;">No active tasks assigned to this release cycle.</div>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background: #F5840B; padding: 40px 20px; text-align: center; color: white; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; }
        .content { padding: 40px; }
        .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
        .project-card { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #F5840B; }
        .task-section { margin-top: 32px; }
        .label { font-size: 10px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .value { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background: #F5840B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>AETHER<span style="font-weight: 300;">TRACKER</span></h1>
          <p style="margin: 8px 0 0; font-size: 12px; font-weight: 600; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.2em;">Project Coordination Network</p>
        </div>
        <div class="content">
          <div class="greeting">System Access Initialized</div>
          <p>Hello <strong>${coordinator.name}</strong>,</p>
          <p>You have been officially provisioned as a <strong>Project Coordinator</strong> for the following operational cycle:</p>
          
          <div class="project-card">
            <div class="label">Project Identity</div>
            <div class="value">${project.name} (RELEASE_${project.version.toUpperCase()})</div>
            
            <div class="label">Assignment Role</div>
            <div class="value">Operational Coordinator</div>
            
            <div class="label">Co-Coordination Staff</div>
            <div class="value">${otherCoordinators}</div>
          </div>

          <div class="task-section">
            <div class="label" style="margin-bottom: 12px; border-bottom: 2px solid #F5840B; display: inline-block;">Current Task Backlog</div>
            ${taskListHtml}
          </div>
          
          <p style="margin-top: 32px;">Please log in to the AetherTracker terminal to synchronize with current mission objectives and task backlogs.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} AetherTracker System Control. All rights reserved.<br>
          Automated Transmission - Do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const payload = {
      sender: { name: "AetherTracker Admin", email: process.env.EMAIL_USER },
      to: [{ email: coordinator.email, name: coordinator.name }],
      subject: `[AetherTracker] New Assignment: ${project.name} Coordinator`,
      htmlContent: htmlContent
    };
    
    console.log(`DEBUG: Sending Brevo Payload to ${coordinator.email}`);

    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`DEBUG: Brevo Success for ${coordinator.email}:`, response.data);
  } catch (error) {
    console.error('DEBUG: Brevo Email Error:', error.response?.data || error.message);
    throw error; // Re-throw to be caught by the route handler
  }
};
