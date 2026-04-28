# Deployment Checklist

Use this checklist to ensure smooth deployment of your FGBFI Attendance System.

## Pre-Deployment

### Backend Setup
- [ ] Install Node.js 18+ on your machine
- [ ] Run `cd backend && npm install`
- [ ] Generate VAPID keys: `npx web-push generate-vapid-keys`
- [ ] Create `.env` file from `.env.example`
- [ ] Add VAPID keys to `.env`
- [ ] Set strong `JWT_SECRET` in `.env`
- [ ] Run `npm run init-db` to create database
- [ ] Update admin phone number in database
- [ ] Test backend locally: `npm run dev`
- [ ] Verify API responds at http://localhost:3001/api

### Frontend Setup
- [ ] Run `cd frontend && npm install`
- [ ] Create `.env` file from `.env.example`
- [ ] Set `VITE_API_URL=http://localhost:3001/api`
- [ ] Create PWA icons (see ICONS.md)
- [ ] Test frontend locally: `npm run dev`
- [ ] Open http://localhost:3000 and test login

### Local Testing
- [ ] Login as admin works
- [ ] Start attendance session works
- [ ] Location permission requested
- [ ] Notifications permission requested
- [ ] Test on mobile device via network IP
- [ ] Login as member on second device
- [ ] Verify push notification received
- [ ] Mark attendance works
- [ ] Admin can close session
- [ ] View attendance history works

## Production Deployment

### Backend (Railway/Render)
- [ ] Create account on Railway or Render
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Add environment variables:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `JWT_SECRET`
  - `PORT=3001`
- [ ] Deploy and note the backend URL
- [ ] Test API endpoint: `https://your-backend.com/api/push/vapid-public-key`
- [ ] SSH into server and run `npm run init-db` (if needed)
- [ ] Update admin phone in production database

### Frontend (Vercel)
- [ ] Create account on Vercel
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Framework preset: Vite
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Add environment variable:
  - `VITE_API_URL=https://your-backend-url.com/api`
- [ ] Deploy and note the frontend URL
- [ ] Visit your app URL
- [ ] Verify PWA manifest loads (DevTools → Application)

### Post-Deployment Testing
- [ ] Open app on mobile device
- [ ] Login as admin
- [ ] Enable notifications (HTTPS required, so this should work now)
- [ ] Start attendance session
- [ ] Check location is detected
- [ ] Login on second device as member
- [ ] Enable notifications on member device
- [ ] Admin starts new session
- [ ] Verify member receives push notification
- [ ] Member marks attendance
- [ ] Verify distance calculation works
- [ ] Check attendance appears in history
- [ ] Admin closes session
- [ ] Check stats update correctly

### PWA Installation
- [ ] On iOS Safari: Share → Add to Home Screen
- [ ] On Android Chrome: Menu → Install App
- [ ] On Desktop: Address bar install icon
- [ ] Verify app icon shows correctly
- [ ] Test offline functionality

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] VAPID keys kept secret (not in git)
- [ ] `.env` files in `.gitignore`
- [ ] CORS configured correctly
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] Database backed up regularly
- [ ] Consider rate limiting for production

## Go-Live Checklist

- [ ] Create initial admin accounts
- [ ] Share app URL with members
- [ ] Provide installation instructions
- [ ] Test during actual meeting
- [ ] Monitor for errors
- [ ] Collect user feedback

## Monitoring

After deployment, monitor:
- [ ] API response times
- [ ] Push notification delivery rate
- [ ] Database size/performance
- [ ] Error logs
- [ ] User adoption rate

## Troubleshooting Resources

If issues arise:
1. Check README.md troubleshooting section
2. Review browser console for errors
3. Check backend logs in Railway/Render dashboard
4. Verify environment variables are set correctly
5. Test geolocation and notifications permissions

## Success Criteria

Your deployment is successful when:
- ✅ Admins can start/close sessions
- ✅ Members receive push notifications
- ✅ Location verification works
- ✅ Attendance is recorded accurately
- ✅ App works on iOS and Android
- ✅ PWA can be installed

---

Need help? Check README.md or QUICKSTART.md for detailed instructions.
