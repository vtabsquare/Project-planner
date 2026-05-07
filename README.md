# AetherTracker 🚀

A full-stack project management platform with task tracking, coordinator assignment, email notifications, and role-based access control.

---

## 🏗️ Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Email**: Brevo (Sendinblue)
- **Auth**: Cookie Sessions + Google OAuth2

---

## 🖥️ Local Development

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

### 3. Start both servers
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 🚀 Deploying to Render

### Step 1: Push to GitHub
Make sure your project is in a GitHub repository. Ensure `.env` is in `.gitignore`.

### Step 2: Create a Web Service on Render
1. Go to [render.com](https://render.com) and click **New → Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18+

### Step 3: Set Environment Variables on Render
In the Render dashboard → **Environment** tab, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `MONGODB_URI` | `mongodb+srv://...` |
| `SESSION_SECRET` | `your-secret-key` |
| `GOOGLE_CLIENT_ID` | From Google Console |
| `GOOGLE_CLIENT_SECRET` | From Google Console |
| `APP_URL` | `https://your-app.onrender.com` |
| `BREVO_API_KEY` | From Brevo Dashboard |

### Step 4: Update Google OAuth Redirect URI
In [Google Cloud Console](https://console.cloud.google.com):
- Add `https://your-app.onrender.com/auth/callback` to **Authorized Redirect URIs**

### Step 5: Authorize Brevo IP
If using Brevo's IP allowlist, add Render's IP or disable IP restrictions.

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `sanjaysaravanan.vtab@gmail.com` | `Sanjay@1306` |
| Admin | `sanjaysaravanan130604@gmail.com` | `Sanjay@1306` |
| User | `user1@aethertracker.com` | `User@123` |

> ⚠️ Change all passwords after first deployment!

---

## 📁 Project Structure
```
aethertracker/
├── backend/          # Express API server
│   ├── controllers/  # Auth & user logic
│   ├── models/       # MongoDB schemas
│   ├── routes/       # API route handlers
│   ├── utils/        # Email service
│   └── server.js     # Entry point
├── frontend/         # React + Vite app
│   └── src/
│       ├── components/
│       ├── pages/
│       └── views/
├── render.yaml       # Render deployment config
└── package.json      # Root scripts
```
