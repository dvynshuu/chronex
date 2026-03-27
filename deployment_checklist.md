# 🚀 Chronex Production Deployment Checklist

Follow these steps to deploy Chronex using your Netlify and Render accounts.

## 1. Backend Deployment (Render)
Go to [Render.com](https://render.com) and create a **New Web Service**.

- **Repository**: Connect your GitHub repository.
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
    - `MONGODB_URI`: (Your MongoDB Atlas connection string)
    - `JWT_SECRET`: (Any long, random string)
    - `FRONTEND_URL`: (Your future Netlify URL, e.g., `https://chronex.netlify.app`)
    - `REDIS_URL`: (Optional - Render has a built-in Redis or use Upstash)

## 2. Frontend Deployment (Netlify)
Go to [Netlify.com](https://netlify.com) and create a **New Site**.

- **Repository**: Connect your GitHub repository.
- **Base Directory**: `client`
- **Build Command**: `npm run build`
- **Publish Directory**: `client/dist` (Note: Netlify usually auto-detects `dist` relative to base)
- **Environment Variables**:
    - `VITE_API_URL`: (The URL of your Render backend, e.g., `https://chronex-backend.onrender.com`)

## 3. Post-Deployment Check
1. Copy your **Netlify URL** and paste it into the `FRONTEND_URL` variable in your **Render** settings.
2. Restart the Render service.
3. Open your Netlify site and try logging in!

> [!TIP]
> Make sure your MongoDB Atlas cluster has **0.0.0.0/0** (or Render's specific outbound IPs) whitelisted so the backend can connect.
