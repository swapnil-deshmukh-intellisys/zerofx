# ShraddhaBackend Deployment Guide for Render

## ✅ Deployment Readiness Status: **READY**

Your backend is ready for deployment on Render with the following setup:

## 📋 Pre-Deployment Checklist

### ✅ Completed:
- [x] Package.json configured correctly
- [x] Server.js uses process.env.PORT
- [x] Environment-based CORS configuration
- [x] Health check endpoint added
- [x] Error handling middleware
- [x] Database connection with fallback
- [x] Render.yaml configuration file created
- [x] **Uses pnpm** - Faster, more efficient package management

### ⚠️ Required Before Deployment:

1. **Environment Variables Setup:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forex_trading
   JWT_SECRET=your-super-secret-jwt-key-here
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   NODE_ENV=production
   ```

2. **Database Setup:**
   - Create MongoDB Atlas cluster
   - Get connection string
   - Add to Render environment variables

3. **File Storage Consideration:**
   - Current setup uses local file system
   - For production, consider cloud storage (AWS S3, Cloudinary)
   - Uploads folder won't persist on Render

## 🚀 Deployment Steps

### Option 1: Using Render Dashboard
1. Connect your GitHub repository
2. Select "Web Service"
3. Use these settings:
   - **Build Command:** `pnpm install`
   - **Start Command:** `pnpm start`
   - **Node Version:** 18.x or 20.x

### Option 2: Using render.yaml (Recommended)
1. Push the `render.yaml` file to your repository
2. Render will automatically detect and use the configuration

## 🔧 Environment Variables to Set in Render

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/forex_trading
JWT_SECRET=your-super-secret-jwt-key-here
ALLOWED_ORIGINS=https://your-frontend-domain.com
NODE_ENV=production
PORT=5000
```

## 📁 File Storage Solution (Recommended)

For production, replace local file storage with cloud storage:

### Option 1: Cloudinary
```bash
npm install cloudinary multer-storage-cloudinary
```

### Option 2: AWS S3
```bash
npm install aws-sdk multer-s3
```

## 🔍 Health Check

After deployment, test:
- `https://your-app.onrender.com/health`
- Should return: `{"status":"OK","timestamp":"...","uptime":...}`

## 🐛 Common Issues & Solutions

1. **CORS Errors:** Update `ALLOWED_ORIGINS` with your frontend URL
2. **Database Connection:** Ensure MongoDB Atlas allows connections from Render IPs
3. **File Uploads:** Consider cloud storage for production
4. **Memory Issues:** Render free tier has 512MB limit

## 📊 Monitoring

- Use Render's built-in monitoring
- Check logs in Render dashboard
- Monitor `/health` endpoint

## 🔄 Updates

To update your deployment:
1. Push changes to your repository
2. Render will automatically redeploy
3. Check logs for any issues

---

**Status: ✅ READY FOR DEPLOYMENT**
