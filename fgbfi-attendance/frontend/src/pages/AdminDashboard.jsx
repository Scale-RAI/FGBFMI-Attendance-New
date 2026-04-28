import { useState, useEffect } from 'react';
import api from '../services/api';
import { getCurrentPosition } from '../utils/geolocation';
import './AdminDashboard.css';

function AdminDashboard({ user, onLogout }) {
  const [activeSession, setActiveSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [members, setMembers] = useState([]);
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('session');
  const [editingPatron, setEditingPatron] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadActiveSession(),
      loadStats(),
      loadSessions(),
      loadAdmins(),
      loadMembers()
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

  const loadSessions = async () => {
    try {
      const data = await api.getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadAdmins = async () => {
    try {
      const data = await api.listAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Failed to load admins:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleStartSession = async () => {
    setLoading(true);
    showMessage('', '');

    try {
      const position = await getCurrentPosition();
      const result = await api.startSession(position.latitude, position.longitude);
      
      showMessage('success', `✅ Session started! ${result.notificationsSent} notifications sent.`);
      await loadData();
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    try {
      const result = await api.closeSession(activeSession.id);
      showMessage('success', `✅ Session closed. ${result.totalAttendees} attendees marked.`);
      await loadData();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminPhone.trim()) return;

    try {
      await api.addAdmin(newAdminPhone);
      showMessage('success', '✅ Admin added successfully!');
      setNewAdminPhone('');
      await loadAdmins();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleRemoveAdmin = async (phoneNumber) => {
    if (!confirm('Remove this admin?')) return;

    try {
      await api.removeAdmin(phoneNumber);
      showMessage('success', '✅ Admin removed');
      await loadAdmins();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleUpdatePatron = async (phoneNumber, patron) => {
    try {
      await api.updatePatron(phoneNumber, patron);
      showMessage('success', '✅ Patron updated');
      setEditingPatron(null);
      await loadMembers();
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (text) {
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Admin Panel</h1>
          <p className="phone-display">{user.name} • {user.phone_number}</p>
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

        {stats && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalMembers}</div>
              <div className="stat-label">Total Members</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalSessions}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.averageAttendance}</div>
              <div className="stat-label">Avg Attendance</div>
            </div>
          </div>
        )}

        <div className="session-control card-highlight">
          {activeSession ? (
            <>
              <div className="session-header">
                <h2>🎯 Active Session</h2>
                <span className="badge badge-active">Live</span>
              </div>
              <p className="session-info">
                Started {formatDate(activeSession.created_at)} • {activeSession.radius_meters}m radius
              </p>
              <button onClick={handleCloseSession} className="btn btn-danger btn-large">
                Close Attendance
              </button>
            </>
          ) : (
            <>
              <h2>Start New Session</h2>
              <p className="session-info">This will send push notifications to all members</p>
              <button
                onClick={handleStartSession}
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-small"></div>
                    Getting Location...
                  </>
                ) : (
                  '▶ Start Attendance Session'
                )}
              </button>
            </>
          )}
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'session' ? 'active' : ''}`}
            onClick={() => setActiveTab('session')}
          >
            Sessions
          </button>
          <button
            className={`tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          <button
            className={`tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admin Team
          </button>
        </div>

        {activeTab === 'session' ? (
          <div className="sessions-section">
            <h2>Recent Sessions</h2>
            <div className="sessions-list">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <div key={session.id} className="session-item card">
                    <div className="session-item-header">
                      <div>
                        <div className="session-date">{formatDate(session.created_at)}</div>
                        <div className="session-meta">
                          By {session.admin_name} • {session.attendee_count} attendees
                        </div>
                      </div>
                      <span className={`badge badge-${session.status}`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No sessions yet</p>
              )}
            </div>
          </div>
        ) : activeTab === 'members' ? (
          <div className="members-section">
            <h2>Manage Members</h2>
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item card">
                  <div className="member-info">
                    <div className="member-name">{member.name}</div>
                    <div className="member-phone">{member.phone_number}</div>
                    {member.patron ? (
                      <div className="member-patron">
                        <span className="patron-label">Patron:</span>
                        <span className="patron-value">{member.patron}</span>
                      </div>
                    ) : (
                      <div className="member-patron no-patron">No patron assigned</div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const newPatron = prompt('Enter patron name:', member.patron || '');
                      if (newPatron !== null) {
                        handleUpdatePatron(member.phone_number, newPatron);
                      }
                    }}
                    className="btn btn-secondary btn-small"
                  >
                    {member.patron ? 'Edit Patron' : 'Add Patron'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admins-section">
            <h2>Admin Team</h2>
            
            <form onSubmit={handleAddAdmin} className="add-admin-form card">
              <h3>Add Admin</h3>
              <div className="input-group">
                <label htmlFor="admin-phone">Member Phone Number</label>
                <input
                  id="admin-phone"
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Add to Admin Team
              </button>
            </form>

            <div className="admins-list">
              {admins.map((admin) => (
                <div key={admin.id} className="admin-item card">
                  <div>
                    <div className="admin-name">{admin.name}</div>
                    <div className="admin-phone">{admin.phone_number}</div>
                  </div>
                  {admin.phone_number !== user.phone_number && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.phone_number)}
                      className="btn btn-secondary btn-small"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
