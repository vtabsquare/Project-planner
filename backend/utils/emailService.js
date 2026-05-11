import axios from 'axios';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// ─── Core Mailer ────────────────────────────────────────────────────────────
// Read env vars at CALL TIME (not module load time) to avoid dotenv race condition

const sendEmail = async ({ to, subject, htmlContent }) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const EMAIL_USER = process.env.EMAIL_USER;

  if (!BREVO_API_KEY) {
    console.warn('[EMAIL] BREVO_API_KEY missing — skipping email send');
    return;
  }
  if (!to || to.length === 0) {
    console.warn('[EMAIL] No recipients — skipping email send');
    return;
  }

  const payload = {
    sender: { name: 'AetherTracker', email: EMAIL_USER },
    to,
    subject,
    htmlContent
  };

  console.log(`[EMAIL] Attempting send: "${subject}" → ${to.map(r => r.email).join(', ')}`);

  try {
    const res = await axios.post(BREVO_API_URL, payload, {
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' }
    });
    console.log(`[EMAIL] ✓ Delivered: "${subject}" → ${to.map(r => r.email).join(', ')}`);
    return res.data;
  } catch (err) {
    console.error('[EMAIL] ✗ Send failed:', err.response?.data || err.message);
    throw err;
  }
};

// ─── HTML Base Template ──────────────────────────────────────────────────────

const baseTemplate = ({ title, subtitle, body }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1e293b; }
    .container { max-width: 600px; margin: 24px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 36px 40px; text-align: center; }
    .header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.02em; text-transform: uppercase; }
    .header h1 span { color: #F5840B; font-weight: 400; }
    .badge { display: inline-block; margin-top: 10px; padding: 4px 14px; background: #F5840B; color: #fff; border-radius: 99px; font-size: 10px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; }
    .content { padding: 36px 40px; }
    .card { background: #f1f5f9; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border-left: 4px solid #F5840B; }
    .label { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 3px; }
    .value { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
    .value:last-child { margin-bottom: 0; }
    table.task-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    table.task-table th { font-size: 9px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; }
    table.task-table td { font-size: 12px; padding: 10px; border-bottom: 1px solid #f1f5f9; }
    .status-badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .status-open { background: #dbeafe; color: #1d4ed8; }
    .status-completed { background: #dcfce7; color: #15803d; }
    .footer { padding: 20px 40px; text-align: center; font-size: 11px; color: #94a3b8; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    p { font-size: 14px; line-height: 1.7; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AETHER<span>TRACKER</span></h1>
      <span class="badge">${title}</span>
    </div>
    <div class="content">
      <p style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:4px;">${subtitle}</p>
      ${body}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} AetherTracker System Control &nbsp;|&nbsp; Automated Notification &mdash; Do not reply.
    </div>
  </div>
</body>
</html>`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildRecipientList = (coordinators = [], adminEmails = []) => {
  const seen = new Set();
  const all = [];
  for (const c of coordinators) {
    const key = (c.email || '').toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); all.push({ email: c.email, name: c.name || c.email }); }
  }
  for (const email of adminEmails) {
    const key = email.toLowerCase();
    if (!seen.has(key)) { seen.add(key); all.push({ email, name: 'System Admin' }); }
  }
  return all;
};

// ─── 1. Coordinator Added ────────────────────────────────────────────────────

export const sendCoordinatorEmail = async (coordinator, project, tasks = []) => {
  const otherCoords = (project.coordinators || [])
    .filter(c => c.email !== coordinator.email)
    .map(c => c.name).join(', ') || 'None yet';

  const taskRows = tasks.length
    ? tasks.map(t => `
        <tr>
          <td style="font-weight:700;color:#0f172a;">${t.name}</td>
          <td>${t.priority || 'Medium'}</td>
          <td><span class="status-badge status-open">${t.status || 'Open'}</span></td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="color:#94a3b8;font-style:italic;">No tasks assigned yet.</td></tr>`;

  const body = `
    <p>Hello <strong>${coordinator.name}</strong>,</p>
    <p>You have been assigned as a <strong>Project Coordinator</strong> for the release cycle below. All coordinators on this project will receive notifications about new tasks, status changes, and project closure.</p>
    <div class="card">
      <div class="label">Project</div>
      <div class="value">${project.name} &mdash; RELEASE_${String(project.version).toUpperCase()}</div>
      <div class="label">Co-Coordinators</div>
      <div class="value">${otherCoords}</div>
    </div>
    <p><strong>Current Task Backlog:</strong></p>
    <table class="task-table">
      <tr><th>Task</th><th>Priority</th><th>Status</th></tr>
      ${taskRows}
    </table>`;

  await sendEmail({
    to: [{ email: coordinator.email, name: coordinator.name }],
    subject: `[AetherTracker] You're now a Coordinator: ${project.name} v${project.version}`,
    htmlContent: baseTemplate({ title: 'Coordinator Assignment', subtitle: 'New Role Provisioned', body })
  });
};

// ─── Notify ALL coordinators when a new coordinator is added ─────────────────

export const notifyAllCoordinatorsOnNewMember = async (newCoordinator, project, adminEmails = []) => {
  // Notify everyone EXCEPT the newly added coordinator themselves
  const others = (project.coordinators || []).filter(c =>
    (c.email || '').toLowerCase().trim() !== (newCoordinator.email || '').toLowerCase().trim()
  );

  // Always include admins — even if there are no other coordinators
  const recipients = buildRecipientList(others, adminEmails);
  if (!recipients.length) {
    console.log('[EMAIL] notifyAllCoordinatorsOnNewMember: no other recipients to notify.');
    return;
  }

  const body = `
    <p>A new coordinator has been added to your project:</p>
    <div class="card">
      <div class="label">Project</div>
      <div class="value">${project.name} &mdash; RELEASE_${String(project.version).toUpperCase()}</div>
      <div class="label">New Coordinator</div>
      <div class="value">${newCoordinator.name} &lt;${newCoordinator.email}&gt;</div>
    </div>
    <p>Login to AetherTracker to review the updated coordination team.</p>`;

  await sendEmail({
    to: recipients,
    subject: `[AetherTracker] New Team Member Added: ${project.name} v${project.version}`,
    htmlContent: baseTemplate({ title: 'Team Update', subtitle: 'New Coordinator Assigned', body })
  });
};

// ─── 2. New Version Created ──────────────────────────────────────────────────

export const notifyNewVersion = async (project, coordinators = [], adminEmails = []) => {
  const recipients = buildRecipientList(coordinators, adminEmails);
  if (!recipients.length) return;

  const body = `
    <p>A new project version has been registered in the system:</p>
    <div class="card">
      <div class="label">Project</div>
      <div class="value">${project.name}</div>
      <div class="label">New Version</div>
      <div class="value">RELEASE_${String(project.version).toUpperCase()}</div>
      <div class="label">Estimated Completion</div>
      <div class="value">${project.estimatedCompletionDate || 'Not set'}</div>
      ${project.description ? `<div class="label">Description</div><div class="value">${project.description}</div>` : ''}
    </div>
    <p>Login to AetherTracker to view the new project cycle.</p>`;

  await sendEmail({
    to: recipients,
    subject: `[AetherTracker] New Version Deployed: ${project.name} v${project.version}`,
    htmlContent: baseTemplate({ title: 'New Version', subtitle: 'Project Release Cycle Initiated', body })
  });
};

// ─── 3. New Task Created ─────────────────────────────────────────────────────

export const notifyNewTask = async (task, project, adminEmails = []) => {
  const recipients = buildRecipientList(project.coordinators || [], adminEmails);
  if (!recipients.length) return;

  const body = `
    <p>A new task has been added to a project you coordinate:</p>
    <div class="card">
      <div class="label">Project</div>
      <div class="value">${task.project} &mdash; RELEASE_${String(task.version).toUpperCase()}</div>
      <div class="label">Task Name</div>
      <div class="value">${task.name}</div>
      <div class="label">Priority</div>
      <div class="value">${task.priority || 'Medium'}</div>
      ${task.dueDate ? `<div class="label">Due Date</div><div class="value">${task.dueDate}</div>` : ''}
    </div>
    <p>Login to AetherTracker to view full task details and track progress.</p>`;

  await sendEmail({
    to: recipients,
    subject: `[AetherTracker] New Task Signal: "${task.name}" — ${task.project} v${task.version}`,
    htmlContent: baseTemplate({ title: 'Task Created', subtitle: 'New Objective Registered', body })
  });
};

// ─── 4. Task Completed ───────────────────────────────────────────────────────

export const notifyTaskCompleted = async (task, project, adminEmails = []) => {
  const recipients = buildRecipientList(project.coordinators || [], adminEmails);
  if (!recipients.length) return;

  const body = `
    <p>A task has been marked as <strong style="color:#15803d;">Completed</strong>:</p>
    <div class="card">
      <div class="label">Project</div>
      <div class="value">${task.project} &mdash; RELEASE_${String(task.version).toUpperCase()}</div>
      <div class="label">Task</div>
      <div class="value">${task.name}</div>
      <div class="label">Priority</div>
      <div class="value">${task.priority || 'Medium'}</div>
      <div class="label">Completed At</div>
      <div class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
    </div>
    <p>Login to AetherTracker to review remaining tasks for this release cycle.</p>`;

  await sendEmail({
    to: recipients,
    subject: `[AetherTracker] Task Completed: "${task.name}" — ${task.project} v${task.version}`,
    htmlContent: baseTemplate({ title: 'Task Completed', subtitle: 'Objective Closed', body })
  });
};

// ─── 5. Project Finalized / Closed ──────────────────────────────────────────

export const notifyProjectClosed = async (project, adminEmails = []) => {
  const recipients = buildRecipientList(project.coordinators || [], adminEmails);
  if (!recipients.length) return;

  const body = `
    <p>A project release cycle has been <strong style="color:#0f172a;">Finalized & Closed</strong>:</p>
    <div class="card">
      <div class="label">Project</div>
      <div class="value">${project.name}</div>
      <div class="label">Version</div>
      <div class="value">RELEASE_${String(project.version).toUpperCase()}</div>
      <div class="label">Status</div>
      <div class="value" style="color:#15803d;font-weight:900;">&#x2713; CLOSED</div>
      <div class="label">Finalized At</div>
      <div class="value">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
    </div>
    <p>All objectives for this release have been concluded. Thank you for your coordination.</p>`;

  await sendEmail({
    to: recipients,
    subject: `[AetherTracker] Project Finalized: ${project.name} v${project.version}`,
    htmlContent: baseTemplate({ title: 'Project Closed', subtitle: 'Release Cycle Concluded', body })
  });
};
