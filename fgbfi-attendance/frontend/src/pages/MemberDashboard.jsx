import { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentPosition } from '../utils/geolocation';
import { requestNotificationPermission, subscribeToPush, checkPushSubscription } from '../utils/push';
import './MemberDashboard.css';

function MemberDashboard({ user, onLogout }) {
  const [activeSession, setActiveSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadData();
    checkPushStatus();
    
    // Check for active session every 30 seconds
    const interval = setInterval(loadActiveSession, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkPushStatus = async () => {
    const subscription = await checkPushSubscription();
    setPushEnabled(!!subscription);
  };

  const loadData = async () => {
    await Promise.all([
      loadActiveSession(),
      loadStats(),
      loadHistory()
    ]);
  };

  const loadActiveSession = async () => {
    try {
      const session = await api.getActiveSession();
      setActiveSession(session);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      await requestNotificationPermission();
      await subscribeToPush();
      setPushEnabled(true);
      showMessage('success', '✅ Push notifications enabled!');
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleMarkAttendance = async () => {
    if (!activeSession) return;

    setLoading(true);
    showMessage('', '');

    try {
      const position = await getCurrentPosition();
      await api.markAttendance(
        activeSession.id,
        position.latitude,
        position.longitude
      );

      showMessage('success', '✅ Attendance marked successfully!');
      setShowConfirmation(false);
      await loadData();
    } catch (error) {
      showMessage('error', error.message);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (text) {
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="phone-display">{user.phone_number}</p>
        </div>
        <button onClick={onLogout} className="btn btn-secondary btn-small">
          Sign Out
        </button>
      </header>

      <div className="dashboard-content">
        {message.text && (
          <div className={`alert alert-${message.type} animate-in`}>
            {message.text}
          </div>
        )}

        {!pushEnabled && (
          <div className="notification-prompt card-highlight">
            <h3>📱 Enable Notifications</h3>
            <p>Get instant alerts when attendance opens</p>
            <button onClick={handleEnableNotifications} className="btn btn-primary">
              Enable Push Notifications
            </button>
          </div>
        )}

        {activeSession ? (
          <div className="active-session card-highlight animate-in">
            <div className="session-header">
              <h2>🎯 Attendance Open</h2>
              <span className="badge badge-active">Active</span>
            </div>
            <p className="session-info">
              Started by {activeSession.admin_name} • {activeSession.radius_meters}m radius
            </p>
            
            {activeSession.alreadyMarked ? (
              <div className="already-marked">
                <span className="check-icon">✓</span>
                <p>You've already marked attendance for this session</p>
              </div>
            ) : (
              <>
                {!showConfirmation ? (
                  <button
                    onClick={() => setShowConfirmation(true)}
                    className="btn btn-success btn-large"
                  >
                    ✓ Mark Attendance
                  </button>
                ) : (
                  <div className="confirmation-modal">
                    <h3>Confirm Attendance</h3>
                    <div className="confirmation-details">
                      <div className="confirmation-row">
                        <span className="label">Your Name:</span>
                        <span className="value">{user.name}</span>
                      </div>
                      {user.patron && (
                        <div className="confirmation-row highlight">
                          <span className="label">Your Patron:</span>
                          <span className="value">{user.patron}</span>
                        </div>
                      )}
                    </div>
                    <div className="confirmation-actions">
                      <button
                        onClick={handleMarkAttendance}
                        className="btn btn-success"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="spinner-small"></div>
                            Confirming...
                          </>
                        ) : (
                          '✓ Confirm'
                        )}
                      </button>
                      <button
                        onClick={() => setShowConfirmation(false)}
                        className="btn btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="no-session card">
            <h3>No Active Session</h3>
            <p>Waiting for attendance to open...</p>
          </div>
        )}

        {stats && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalAttended}</div>
              <div className="stat-label">Sessions Attended</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.attendanceRate}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
        )}

        <div className="history-section">
          <h2>Recent Attendance</h2>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((record) => (
                <div key={record.id} className="history-item card">
                  <div className="history-date">{formatDate(record.marked_at)}</div>
                  <div className="history-distance">{Math.round(record.distance_meters)}m away</div>
                </div>
              ))
            ) : (
              <p className="empty-state">No attendance records yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberDashboard;
