import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import webpush from 'web-push';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const db = new Database('attendance.db');
const PORT = process.env.PORT || 3001;

// VAPID keys for push notifications (generate with: npx web-push generate-vapid-keys)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

webpush.setVapidDetails(
  'mailto:admin@fgbfi.org',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

app.use(cors());
app.use(express.json());

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// ==================== AUTH ROUTES ====================

// Register/Login (simplified - uses phone number only)
app.post('/api/auth/register', (req, res) => {
  const { phoneNumber, name, patron } = req.body;

  if (!phoneNumber || !name) {
    return res.status(400).json({ error: 'Phone number and name required' });
  }

  try {
    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber);

    if (!user) {
      // Create new user
      const result = db.prepare('INSERT INTO users (phone_number, name, patron, role) VALUES (?, ?, ?, ?)').run(
        phoneNumber,
        name,
        patron || null,
        'member'
      );
      user = { id: result.lastInsertRowid, phone_number: phoneNumber, name, patron: patron || null, role: 'member' };
    }

    const token = jwt.sign(
      { id: user.id, phoneNumber: user.phone_number, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        patron: user.patron,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user info
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, phone_number, name, patron, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ==================== PUSH SUBSCRIPTION ROUTES ====================

app.post('/api/push/subscribe', authenticateToken, (req, res) => {
  const { endpoint, keys } = req.body;

  try {
    db.prepare(`
      INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, endpoint, keys.p256dh, keys.auth);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get VAPID public key
app.get('/api/push/vapid-public-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

// ==================== ADMIN ROUTES ====================

// Add member to admin team
app.post('/api/admin/add-member', authenticateToken, requireAdmin, (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', user.id);
    res.json({ success: true, message: 'User promoted to admin' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove member from admin team
app.post('/api/admin/remove-member', authenticateToken, requireAdmin, (req, res) => {
  const { phoneNumber } = req.body;

  try {
    db.prepare('UPDATE users SET role = ? WHERE phone_number = ?').run('member', phoneNumber);
    res.json({ success: true, message: 'User demoted to member' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all admins
app.get('/api/admin/list', authenticateToken, requireAdmin, (req, res) => {
  const admins = db.prepare('SELECT id, phone_number, name, created_at FROM users WHERE role = ?').all('admin');
  res.json(admins);
});

// Update user patron (admin only)
app.post('/api/admin/update-patron', authenticateToken, requireAdmin, (req, res) => {
  const { phoneNumber, patron } = req.body;

  if (!phoneNumber || !patron) {
    return res.status(400).json({ error: 'Phone number and patron required' });
  }

  try {
    db.prepare('UPDATE users SET patron = ? WHERE phone_number = ?').run(patron, phoneNumber);
    res.json({ success: true, message: 'Patron updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all members with patron info (admin only)
app.get('/api/admin/members', authenticateToken, requireAdmin, (req, res) => {
  const members = db.prepare('SELECT id, phone_number, name, patron, created_at FROM users WHERE role = ?').all('member');
  res.json(members);
});

// Get attendance grouped by patron (admin only)
app.get('/api/admin/attendance-by-patron/:sessionId', authenticateToken, requireAdmin, (req, res) => {
  const { sessionId } = req.params;

  const attendees = db.prepare(`
    SELECT u.patron, COUNT(*) as count, GROUP_CONCAT(u.name) as members
    FROM attendance_records ar
    JOIN users u ON ar.user_id = u.id
    WHERE ar.session_id = ?
    GROUP BY u.patron
    ORDER BY u.patron
  `).all(sessionId);

  res.json(attendees);
});

// ==================== ATTENDANCE SESSION ROUTES ====================

// Start attendance session
app.post('/api/attendance/start', authenticateToken, requireAdmin, (req, res) => {
  const { latitude, longitude, radiusMeters = 100 } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Location required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO attendance_sessions (admin_id, latitude, longitude, radius_meters)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, latitude, longitude, radiusMeters);

    const sessionId = result.lastInsertRowid;

    // Get all push subscriptions for members
    const subscriptions = db.prepare(`
      SELECT ps.endpoint, ps.p256dh, ps.auth, u.name
      FROM push_subscriptions ps
      JOIN users u ON ps.user_id = u.id
      WHERE u.role = 'member'
    `).all();

    // Send push notifications
    const payload = JSON.stringify({
      title: '📍 Attendance Open',
      body: 'Tap to mark your attendance',
      sessionId,
      requiresInteraction: true
    });

    const pushPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSubscription, payload).catch(err => {
        console.error('Push failed:', err);
      });
    });

    Promise.all(pushPromises);

    res.json({
      sessionId,
      notificationsSent: subscriptions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Close attendance session
app.post('/api/attendance/close/:sessionId', authenticateToken, requireAdmin, (req, res) => {
  const { sessionId } = req.params;

  try {
    db.prepare('UPDATE attendance_sessions SET status = ?, closed_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('closed', sessionId);

    const count = db.prepare('SELECT COUNT(*) as count FROM attendance_records WHERE session_id = ?')
      .get(sessionId);

    res.json({ success: true, totalAttendees: count.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active session
app.get('/api/attendance/active', authenticateToken, (req, res) => {
  const session = db.prepare(`
    SELECT s.*, u.name as admin_name
    FROM attendance_sessions s
    JOIN users u ON s.admin_id = u.id
    WHERE s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1
  `).get();

  if (!session) {
    return res.json(null);
  }

  // Check if user already marked attendance
  const alreadyMarked = db.prepare(`
    SELECT id FROM attendance_records
    WHERE session_id = ? AND user_id = ?
  `).get(session.id, req.user.id);

  res.json({
    ...session,
    alreadyMarked: !!alreadyMarked
  });
});

// Mark attendance
app.post('/api/attendance/mark', authenticateToken, (req, res) => {
  const { sessionId, latitude, longitude } = req.body;

  if (!sessionId || !latitude || !longitude) {
    return res.status(400).json({ error: 'Session ID and location required' });
  }

  try {
    const session = db.prepare('SELECT * FROM attendance_sessions WHERE id = ? AND status = ?')
      .get(sessionId, 'active');

    if (!session) {
      return res.status(404).json({ error: 'Session not found or already closed' });
    }

    // Check if already marked
    const existing = db.prepare('SELECT id FROM attendance_records WHERE session_id = ? AND user_id = ?')
      .get(sessionId, req.user.id);

    if (existing) {
      return res.status(400).json({ error: 'Attendance already marked for this session' });
    }

    // Calculate distance
    const distance = calculateDistance(
      session.latitude,
      session.longitude,
      latitude,
      longitude
    );

    if (distance > session.radius_meters) {
      return res.status(400).json({
        error: 'You are too far from the attendance location',
        distance: Math.round(distance),
        required: session.radius_meters
      });
    }

    // Mark attendance
    db.prepare(`
      INSERT INTO attendance_records (session_id, user_id, latitude, longitude, distance_meters)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, req.user.id, latitude, longitude, distance);

    res.json({ success: true, distance: Math.round(distance) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attendance history (for member)
app.get('/api/attendance/history', authenticateToken, (req, res) => {
  const records = db.prepare(`
    SELECT ar.*, s.created_at as session_date
    FROM attendance_records ar
    JOIN attendance_sessions s ON ar.session_id = s.id
    WHERE ar.user_id = ?
    ORDER BY ar.marked_at DESC
    LIMIT 50
  `).all(req.user.id);

  res.json(records);
});

// Get session details with attendees (admin only)
app.get('/api/attendance/session/:sessionId', authenticateToken, requireAdmin, (req, res) => {
  const { sessionId } = req.params;

  const session = db.prepare(`
    SELECT s.*, u.name as admin_name
    FROM attendance_sessions s
    JOIN users u ON s.admin_id = u.id
    WHERE s.id = ?
  `).get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const attendees = db.prepare(`
    SELECT ar.*, u.name, u.phone_number, u.patron
    FROM attendance_records ar
    JOIN users u ON ar.user_id = u.id
    WHERE ar.session_id = ?
    ORDER BY ar.marked_at
  `).all(sessionId);

  res.json({ ...session, attendees });
});

// Get all sessions (admin only)
app.get('/api/attendance/sessions', authenticateToken, requireAdmin, (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, u.name as admin_name,
      (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id) as attendee_count
    FROM attendance_sessions s
    JOIN users u ON s.admin_id = u.id
    ORDER BY s.created_at DESC
    LIMIT 100
  `).all();

  res.json(sessions);
});

// ==================== STATS ROUTES ====================

app.get('/api/stats/overview', authenticateToken, (req, res) => {
  if (req.user.role === 'admin') {
    const totalMembers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('member');
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions').get();
    const avgAttendance = db.prepare(`
      SELECT AVG(attendee_count) as avg FROM (
        SELECT COUNT(*) as attendee_count
        FROM attendance_records
        GROUP BY session_id
      )
    `).get();

    res.json({
      totalMembers: totalMembers.count,
      totalSessions: totalSessions.count,
      averageAttendance: Math.round(avgAttendance.avg || 0)
    });
  } else {
    const totalAttended = db.prepare('SELECT COUNT(*) as count FROM attendance_records WHERE user_id = ?')
      .get(req.user.id);
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM attendance_sessions WHERE status = ?')
      .get('closed');

    res.json({
      totalAttended: totalAttended.count,
      totalSessions: totalSessions.count,
      attendanceRate: totalSessions.count > 0
        ? Math.round((totalAttended.count / totalSessions.count) * 100)
        : 0
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
