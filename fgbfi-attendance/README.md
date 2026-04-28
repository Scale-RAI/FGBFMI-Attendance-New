# FGBFI Attendance System

A modern, location-based attendance tracking system for Full Gospel Business Fellowship International - Young Executives Chapter.

## 🎯 Features

- **Location-Based Attendance**: Admin triggers attendance from venue, members within 50-100m can mark attendance
- **Push Notifications**: Real-time notifications to all members when attendance opens
- **Progressive Web App**: Installable on any device, works offline
- **Admin Panel**: 
  - Start/close attendance sessions
  - Manage admin team members
  - View attendance statistics and history
- **Member Dashboard**:
  - Receive attendance notifications
  - Mark attendance with location verification
  - View personal attendance history and stats

## 🚀 Tech Stack

**Frontend:**
- React 18
- React Router for navigation
- Vite for build tooling
- PWA with Service Workers
- Web Push API for notifications
- Geolocation API

**Backend:**
- Node.js + Express
- SQLite database (easy migration to PostgreSQL)
- JWT authentication
- Web Push (VAPID) for notifications
- RESTful API

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- A domain (for production deployment)

## 🔧 Installation & Setup

### 1. Clone and Install

```bash
cd fgbfi-attendance

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Generate VAPID keys for push notifications
npx web-push generate-vapid-keys

# Add the keys to .env file
# VAPID_PUBLIC_KEY=your_public_key
# VAPID_PRIVATE_KEY=your_private_key
# JWT_SECRET=your_random_secret_key

# Initialize database
npm run init-db
```

**Important**: The database initialization creates a default admin with phone number `+233000000000`. You need to update this:

```bash
# Open SQLite database
sqlite3 attendance.db

# Update admin phone number
UPDATE users SET phone_number = '+233XXXXXXXXX', name = 'Your Name' WHERE id = 1;

# Exit
.exit
```

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Update API URL if needed (default is http://localhost:3001/api)
```

### 4. Run Locally

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📱 First Time Setup

1. **Admin Login**:
   - Use the phone number you set in the database
   - Enter your name
   - You're now logged in as admin

2. **Enable Notifications** (Members):
   - Click "Enable Push Notifications"
   - Grant permission when prompted

3. **Test Attendance**:
   - Admin: Click "Start Attendance Session"
   - Members: Will receive push notification
   - Members: Click to mark attendance (must be within 100m)

## 🌐 Production Deployment

### Backend Deployment (Railway/Render)

**Railway:**

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo and set root directory to `backend`
4. Add environment variables:
   ```
   VAPID_PUBLIC_KEY=your_key
   VAPID_PRIVATE_KEY=your_key
   JWT_SECRET=your_secret
   PORT=3001
   ```
5. Deploy!

**Render:**

1. Create account at [render.com](https://render.com)
2. New → Web Service
3. Connect your repo
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables
8. Deploy!

### Frontend Deployment (Vercel)

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Root Directory: `frontend`
4. Framework Preset: Vite
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```
8. Deploy!

### Post-Deployment

1. **Update VAPID in Frontend**:
   - The VAPID public key is fetched from the API automatically
   - No action needed!

2. **Test Push Notifications**:
   - Push notifications require HTTPS
   - Vercel provides HTTPS by default
   - Test on a real device (not desktop browser for best results)

3. **Install as PWA**:
   - On mobile: Browser menu → "Add to Home Screen"
   - On desktop: Address bar → Install icon

## 🔐 Security Notes

- Change `JWT_SECRET` to a strong random string in production
- Keep VAPID keys secret
- Never commit `.env` files to git
- Consider adding rate limiting for production
- For sensitive data, migrate from SQLite to PostgreSQL

## 📊 Database Schema

**users**
- id, phone_number (unique), name, role (admin/member)

**push_subscriptions**
- user_id, endpoint, p256dh, auth keys

**attendance_sessions**
- admin_id, latitude, longitude, radius_meters, status

**attendance_records**
- session_id, user_id, latitude, longitude, distance_meters

## 🛠 API Endpoints

### Authentication
- `POST /api/auth/register` - Register/login with phone
- `GET /api/auth/me` - Get current user

### Admin
- `POST /api/admin/add-member` - Promote user to admin
- `POST /api/admin/remove-member` - Demote admin to member
- `GET /api/admin/list` - List all admins

### Attendance
- `POST /api/attendance/start` - Start session (admin)
- `POST /api/attendance/close/:id` - Close session (admin)
- `GET /api/attendance/active` - Get active session
- `POST /api/attendance/mark` - Mark attendance (member)
- `GET /api/attendance/history` - Get personal history
- `GET /api/attendance/sessions` - Get all sessions (admin)

### Push
- `POST /api/push/subscribe` - Subscribe to notifications
- `GET /api/push/vapid-public-key` - Get VAPID public key

## 🎨 Customization

### Colors
Edit `/frontend/src/App.css` CSS variables:
```css
:root {
  --night: #0f0f1e;
  --electric: #00d4ff;
  --gold: #ffd700;
  /* etc */
}
```

### Radius
Default is 100m. Change in:
- Backend: `/backend/server.js` (default parameter)
- Frontend: API calls in dashboard components

### Branding
- Replace icons in `/frontend/public/`
- Update app name in `vite.config.js` manifest

## 🐛 Troubleshooting

**Push notifications not working:**
- Ensure HTTPS is enabled (required for push)
- Check browser compatibility (works on Chrome, Firefox, Safari 16.4+)
- Verify VAPID keys are correctly set
- Check browser console for errors

**Location not detected:**
- Ensure location permissions granted
- Use HTTPS (required for geolocation)
- Check device has GPS/location enabled

**Database errors:**
- Run `npm run init-db` in backend
- Check file permissions on `attendance.db`

**Can't connect to backend:**
- Verify `VITE_API_URL` in frontend `.env`
- Check CORS settings in backend
- Ensure backend is running

## 📝 Future Enhancements

- [ ] Export attendance to Excel/CSV
- [ ] QR code integration for new members
- [ ] SMS notifications (fallback for push)
- [ ] Attendance reports and analytics
- [ ] Multi-chapter support
- [ ] Automated attendance reminders

## 👥 Support

For issues or questions:
1. Check troubleshooting section
2. Review API error messages
3. Check browser console for errors

## 📄 License

MIT License - Feel free to modify and use for your organization.

---

Built with ❤️ for FGBFI Young Executives
