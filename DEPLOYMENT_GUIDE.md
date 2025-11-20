# QR Attendance System - Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Database Setup (MongoDB Atlas)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier)
4. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/qr-attendance`)

### 2. Frontend Deployment (Vercel)
1. Go to https://vercel.com
2. Sign up/Login
3. Click "New Project"
4. Drag & drop the `client/build` folder
5. Deploy - you'll get a URL like `https://your-project.vercel.app`

### 3. Backend Deployment (Render)
1. Go to https://render.com
2. Sign up/Login
3. Click "New" → "Web Service"
4. Connect your GitHub repo or upload the `server` folder
5. Set these environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
6. Deploy

### 4. Update Frontend API URL
After backend deployment, update the API URL in your frontend and redeploy.

## 📁 Project Structure for Deployment

```
QR/
├── client/
│   ├── build/          # ← Deploy this to Vercel
│   └── ...
├── server/             # ← Deploy this to Render
│   ├── index.js
│   ├── models/
│   ├── routes/
│   └── package.json
└── DEPLOYMENT_GUIDE.md
```

## 🔧 Environment Variables

### Backend (Render)
- `NODE_ENV=production`
- `PORT=5000`
- `MONGODB_URI=mongodb+srv://...`
- `JWT_SECRET=your-secret-key`
- `EMAIL_USER=your-email@gmail.com`
- `EMAIL_PASS=your-app-password`
- `FRONTEND_URL=https://your-frontend.vercel.app`

## 🌐 Final URLs
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.onrender.com`
- Database: MongoDB Atlas (cloud)

## ✅ Testing
1. Visit your frontend URL
2. Register a teacher account
3. Create a QR code
4. Test attendance marking
5. Check recent activity

Your QR Attendance System will be live and accessible from anywhere!
