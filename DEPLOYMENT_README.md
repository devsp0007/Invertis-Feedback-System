# 🚀 Deployment Setup Files

## 📦 Files Created

### Frontend (Vercel)
- **`frontend/vercel.json`** - Vercel deployment configuration
  - Build command: `npm run build`
  - Output directory: `dist`
  - Rewrites for SPA routing
  - Security headers configured

- **`frontend/.env.example`** - Environment variables template
  - Copy to `.env.local` for local development
  - Change `VITE_API_URL` for production

### Backend (Render)
- **`server/render.yaml`** - Render deployment configuration
  - Defines service, environment, and build settings
  - Auto-deploys from GitHub
  - Health check configured

- **`server/.env.example`** - Environment variables template
  - Copy to `.env` for local development
  - Add MongoDB connection string and JWT secret

### Documentation
- **`DEPLOYMENT_GUIDE.md`** - Complete step-by-step deployment guide
  - Part 1: MongoDB Atlas setup
  - Part 2: Frontend on Vercel
  - Part 3: Backend on Render
  - Troubleshooting and monitoring

---

## ⚡ Quick Start

### 1. Local Setup
```bash
# Frontend
cd frontend
cp .env.example .env.local
# Edit .env.local with your API URL

# Backend
cd ../server
cp .env.example .env
# Edit .env with MongoDB URL and JWT secret
```

### 2. Push to GitHub
```bash
git add .
git commit -m "Add deployment configurations"
git push origin main
```

### 3. Deploy Frontend (Vercel)
1. Go to https://vercel.com/dashboard
2. Import this GitHub repository
3. Set root directory: `frontend`
4. Add env var: `VITE_API_URL`
5. Deploy!

### 4. Deploy Backend (Render)
1. Go to https://dashboard.render.com
2. Create new Web Service
3. Connect GitHub repository
4. Render auto-reads `render.yaml`
5. Add environment variables
6. Deploy!

### 5. Connect Them
- Update frontend `VITE_API_URL` with your Render backend URL
- Redeploy frontend
- Test the connection

---

## 🔒 Security Notes

**NEVER commit these to Git:**
- `.env` files
- `.env.local` files
- Actual secret values
- Database credentials

**Always:**
- Use strong JWT secrets
- Enable CORS properly
- Whitelist specific origins
- Keep MongoDB IP restricted
- Rotate secrets regularly

---

## 📖 For Detailed Instructions

See **`DEPLOYMENT_GUIDE.md`** for:
- Prerequisites and account setup
- Step-by-step MongoDB configuration
- Detailed Vercel deployment
- Detailed Render deployment
- Environment variable reference
- Troubleshooting guide
- Post-deployment checklist
- Cost breakdown
- Monitoring and maintenance

---

## 🎯 Deployment Architecture

```
┌─────────────────────┐
│   GitHub Repo       │
│  (main branch)      │
└──────────┬──────────┘
           │
      ┌────┴─────┐
      │           │
      ▼           ▼
  ┌─────────┐  ┌─────────┐
  │ Vercel  │  │ Render  │
  │Frontend │  │Backend  │
  └────┬────┘  └────┬────┘
       │             │
       └──────┬──────┘
              │
         ┌────▼────┐
         │ MongoDB │
         │ Atlas   │
         └─────────┘
```

---

## ✅ Pre-Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] MongoDB Atlas cluster set up
- [ ] JWT_SECRET generated (strong random key)
- [ ] Environment variables configured locally
- [ ] Frontend builds successfully: `npm run build`
- [ ] Backend starts successfully: `npm run dev`
- [ ] API connection works locally
- [ ] Vercel account created and authenticated
- [ ] Render account created and authenticated
- [ ] All sensitive values removed from code
- [ ] `.env` files added to `.gitignore`

---

## 🚀 Deploy Now!

1. Read `DEPLOYMENT_GUIDE.md` completely
2. Follow each section step-by-step
3. Test thoroughly
4. Share your live URL!

**Questions?** Check the troubleshooting section in `DEPLOYMENT_GUIDE.md`

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Vite Guide:** https://vitejs.dev/guide/

Happy deploying! 🎉
