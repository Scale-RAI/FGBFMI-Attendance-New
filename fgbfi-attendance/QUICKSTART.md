# Quick Start Guide

## For Local Development (5 minutes)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in new terminal)
cd frontend
npm install
```

### 2. Setup Backend

```bash
cd backend

# Generate VAPID keys
npx web-push generate-vapid-keys

# Create .env file
cat > .env << EOF
VAPID_PUBLIC_KEY=your_public_key_from_above
VAPID_PRIVATE_KEY=your_private_key_from_above
JWT_SECRET=change_this_random_secret
PORT=3001
EOF

# Initialize database
npm run init-db
```

### 3. Update Admin Phone Number

```bash
# Open database
sqlite3 attendance.db

# Run this SQL (replace with your phone)
UPDATE users SET phone_number = '+233XXXXXXXXX', name = 'Your Name' WHERE id = 1;

# Exit
.exit
```

### 4. Setup Frontend

```bash
cd frontend

# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 5. Run Both Services

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Test It Out

1. Open http://localhost:3000
2. Login with your phone number
3. As admin, click "Start Attendance Session"
4. Open another browser/device and login as member
5. Enable notifications
6. Admin starts session → Member gets notification!

## For Production Deployment

See detailed deployment instructions in README.md

**Quick Deploy Checklist:**
- [ ] Deploy backend to Railway/Render
- [ ] Deploy frontend to Vercel
- [ ] Update `VITE_API_URL` to production backend URL
- [ ] Test on real mobile device
- [ ] Install as PWA from browser

## Common Issues

**"Location permission denied"**
→ Grant location access in browser settings

**"Push notifications not showing"**
→ Must use HTTPS (works automatically on Vercel)
→ Test on mobile device (desktop browser notifications can be flaky)

**"Cannot connect to API"**
→ Check `VITE_API_URL` in frontend/.env
→ Ensure backend is running on port 3001

**"Database locked"**
→ Close any other processes using the database
→ Delete attendance.db and run `npm run init-db` again

## Next Steps

1. ✅ Get it running locally
2. 📱 Test on mobile device (for best PWA experience)
3. 🚀 Deploy to production
4. 📊 Add more admins via Admin Panel
5. 👥 Share with members!
