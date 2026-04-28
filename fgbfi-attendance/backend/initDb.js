import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('attendance.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    patron TEXT,
    role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, endpoint)
  );

  CREATE TABLE IF NOT EXISTS attendance_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (admin_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    distance_meters REAL,
    marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(session_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_status ON attendance_sessions(status);
  CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
  CREATE INDEX IF NOT EXISTS idx_records_user ON attendance_records(user_id);
`);

// Create default admin if none exists
const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');

if (adminExists.count === 0) {
  const defaultPhone = '+233000000000'; // Replace with actual admin phone
  db.prepare(`
    INSERT INTO users (phone_number, name, role)
    VALUES (?, ?, ?)
  `).run(defaultPhone, 'Default Admin', 'admin');
  
  console.log(`✅ Database initialized`);
  console.log(`📱 Default admin created with phone: ${defaultPhone}`);
  console.log(`⚠️  Update this in the users table with your actual admin phone number`);
} else {
  console.log('✅ Database schema verified');
}

db.close();
