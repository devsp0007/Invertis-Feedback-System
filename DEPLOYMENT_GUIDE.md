# 🚀 Deployment Guide: Invertis Feedback System

Complete guide to deploy the Invertis Feedback System (TLFQ Platform) with frontend on **Vercel** and backend on **Render**.

---

## 📋 Prerequisites

### Required Accounts
- **GitHub** account (for version control)
- **Vercel** account (free tier: https://vercel.com)
- **Render** account (free tier: https://render.com)
- **MongoDB Atlas** account (free cluster: https://www.mongodb.com/cloud/atlas)

### Local Requirements
- Node.js v18+ and npm
- Git
- Environment variables configured locally

---

## 🛠️ Part 1: Prepare MongoDB Atlas

### Step 1: Create MongoDB Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0 tier)
3. Create a database user with strong password
4. Whitelist IP address `0.0.0.0/0` (allows all IPs)
5. Copy connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dbname?retryWrites=true&w=majority
   ```

### Step 2: Create Database

In MongoDB Atlas:
1. Click "Collections" → "Create Database"
2. Database name: `invertis_feedback`
3. Collection name: `users`
4. This will be auto-populated when server runs

---

## 🌐 Part 2: Frontend Deployment (Vercel)

### Step 1: Push to GitHub

```bash
# In project root
git init
git add .
git commit -m "Initial commit: TLFQ Platform with premium UI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/invertis-feedback-system.git
git push -u origin main
```

### Step 2: Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. **Configure Build:**
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./frontend`

### Step 3: Environment Variables

Add these environment variables in Vercel dashboard:

1. **Project Settings** → **Environment Variables**
2. Add variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-render-api.onrender.com` (add this after backend is deployed)
   - Environments: Production, Preview, Development

3. Click "Save"

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Get your frontend URL: `https://your-project.vercel.app`

**Deployment triggered automatically** on every push to `main` branch.

### Step 5: Post-Deployment

- ✅ Frontend deployed and live
- ⏳ Update backend API URL when backend is ready
- Test login page at `https://your-project.vercel.app`

---

## 🔧 Part 3: Backend Deployment (Render)

### Step 1: Prepare Backend

1. Ensure `server/render.yaml` exists (included)
2. Verify `package.json` has start command:
   ```json
   "scripts": {
     "dev": "node server.js",
     "start": "node server.js"
   }
   ```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. **Configure:**
   - Name: `tlfq-api` (or similar)
   - Environment: `Node`
   - Region: `Oregon` (free tier available)
   - Branch: `main`
   - Build Command: `npm ci`
   - Start Command: `node server.js`
   - Instance Type: `Free`

### Step 3: Add Environment Variables

In Render dashboard → Environment:

```
NODE_ENV=production
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/invertis_feedback
JWT_SECRET=your_super_secret_key_change_this_in_production
CORS_ORIGIN=https://your-frontend.vercel.app
```

**Important:** Keep these values secure!

### Step 4: Deploy

1. Click "Create Web Service"
2. Render auto-deploys from `render.yaml`
3. Wait for deployment (~5 minutes)
4. Get your API URL: `https://your-render-api.onrender.com`

### Step 5: Test Backend

```bash
curl https://your-render-api.onrender.com/health
# Should return 200 OK
```

---

## 🔗 Part 4: Connect Frontend to Backend

### Update Vercel Environment

1. Go to Vercel Project Settings
2. Update `VITE_API_URL`:
   ```
   https://your-render-api.onrender.com
   ```
3. Redeploy frontend:
   ```bash
   git push origin main
   ```

### Verify Connection

1. Visit `https://your-project.vercel.app`
2. Try login with test credentials
3. Check browser console for API calls
4. Verify data flows to MongoDB

---

## 📊 Post-Deployment Checklist

### Security
- ✅ Change `JWT_SECRET` to strong random value
- ✅ Set `CORS_ORIGIN` to frontend URL only
- ✅ Enable MongoDB IP whitelist (or restrict to Render IP)
- ✅ Use HTTPS everywhere
- ✅ Keep environment variables secret (never commit)

### Monitoring
- ✅ Set up Render logs monitoring
- ✅ Configure Vercel error tracking
- ✅ Monitor MongoDB usage in Atlas dashboard
- ✅ Set up uptime alerts

### Performance
- ✅ Test page load times
- ✅ Verify dark mode works
- ✅ Test on mobile devices
- ✅ Check animations are smooth

### Testing
- ✅ Test all login flows (Student, HOD, Super Admin, Supreme)
- ✅ Verify dashboard loads data
- ✅ Test feedback submission
- ✅ Check analytics page rendering
- ✅ Test leaderboard display

---

## 🔄 Continuous Deployment

### Automatic Deployments

**Frontend (Vercel):**
- Triggers on push to `main` branch
- No manual intervention needed
- Automatic rollback if build fails

**Backend (Render):**
- Triggered by `render.yaml` configuration
- Auto-deploys on GitHub push
- Manual redeploy available in dashboard

### Manual Redeploy

**Vercel:**
```bash
# Push changes
git push origin main
# Auto-deploys (no action needed)
```

**Render:**
1. Go to Render dashboard
2. Select service
3. Click "Manual Deploy" button

---

## 🚨 Troubleshooting

### Frontend Won't Load

**Problem:** Vercel shows build error
- Check `npm run build` works locally
- Verify Node version >= 18
- Check environment variables in Vercel

**Solution:**
```bash
# Local testing
npm run build
npm run preview
```

### API Connection Failed

**Problem:** Frontend can't reach backend
- Check backend URL in Vercel env vars
- Verify `CORS_ORIGIN` in Render includes frontend URL
- Check MongoDB connection string

**Solution:**
```bash
# Test backend directly
curl https://your-render-api.onrender.com/health
# Should return 200
```

### MongoDB Connection Error

**Problem:** Backend can't connect to MongoDB
- IP whitelist issue
- Wrong connection string
- Database credentials wrong

**Solution:**
1. Go to MongoDB Atlas
2. Check IP whitelist includes `0.0.0.0/0`
3. Verify credentials in connection string
4. Test connection locally first

### Slow Cold Starts

**Problem:** First request takes 30+ seconds
- Normal on Render free tier (container spins up)
- Premium instances have faster cold starts

**Solution:**
- Use uptimerobot.com for periodic pings
- Or upgrade to paid Render plan

---

## 💰 Cost Overview

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Free | $0 | Unlimited deployments, 100GB bandwidth |
| **Render** | Free | $0 | Auto-sleeps after 15min inactivity |
| **MongoDB Atlas** | M0 | $0 | 512MB storage, shared cluster |
| **Total** | - | **$0** | Fully free for development |

**Upgrade Recommendations:**
- Render Pro: $7/mo for always-on backend
- Vercel Pro: $20/mo for advanced features
- MongoDB M1: $57/mo for dedicated cluster (optional)

---

## 📚 Useful Commands

### Deploy Frontend
```bash
cd frontend
npm run build      # Test build locally
git push origin main # Automatic Vercel deploy
```

### Deploy Backend
```bash
cd server
npm test           # Run tests
git push origin main # Automatic Render deploy
```

### Monitor Logs

**Render Backend:**
```bash
# SSH into render (from dashboard)
# Or check logs in Render dashboard
```

**Vercel Frontend:**
- View logs in Vercel dashboard
- Browser console for client errors

---

## 🔐 Environment Variables Reference

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000  # dev
# Production: https://your-render-api.onrender.com
```

### Backend (.env)
```
NODE_ENV=production
PORT=5000
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_secret_key_here_change_me
CORS_ORIGIN=https://your-frontend.vercel.app
```

**NEVER commit .env files to Git!**

---

## 📞 Support & Resources

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [MongoDB Docs](https://docs.mongodb.com)
- [Vite Guide](https://vitejs.dev/guide/)

### Community Help
- Vercel Community: https://github.com/vercel/next.js/discussions
- Render Support: https://render.com/support
- MongoDB Support: https://www.mongodb.com/community/forums

---

## ✅ Final Checklist

Before going live:
- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Render
- [ ] MongoDB Atlas cluster created
- [ ] Environment variables configured
- [ ] Frontend can connect to backend
- [ ] Login works with test account
- [ ] Dashboard loads data
- [ ] Analytics page works
- [ ] Dark mode functioning
- [ ] Mobile responsive
- [ ] All role permissions work
- [ ] Security headers set
- [ ] Uptime monitoring enabled
- [ ] Error logging configured
- [ ] Backup strategy in place

---

## 🎉 You're Live!

Congratulations! Your Invertis Feedback System is now deployed and accessible worldwide.

**Frontend:** `https://your-project.vercel.app`
**Backend API:** `https://your-render-api.onrender.com`

Share with your team and start collecting feedback! 📊
