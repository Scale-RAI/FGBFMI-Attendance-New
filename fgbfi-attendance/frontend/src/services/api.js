const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  // Auth
  async register(phoneNumber, name, patron) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, name, patron }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Push subscriptions
  async getVapidPublicKey() {
    return this.request('/push/vapid-public-key');
  }

  async subscribePush(subscription) {
    return this.request('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
  }

  // Admin
  async addAdmin(phoneNumber) {
    return this.request('/admin/add-member', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async removeAdmin(phoneNumber) {
    return this.request('/admin/remove-member', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    });
  }

  async listAdmins() {
    return this.request('/admin/list');
  }

  async updatePatron(phoneNumber, patron) {
    return this.request('/admin/update-patron', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, patron }),
    });
  }

  async getMembers() {
    return this.request('/admin/members');
  }

  async getAttendanceByPatron(sessionId) {
    return this.request(`/admin/attendance-by-patron/${sessionId}`);
  }

  // Attendance
  async startSession(latitude, longitude, radiusMeters = 100) {
    return this.request('/attendance/start', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, radiusMeters }),
    });
  }

  async closeSession(sessionId) {
    return this.request(`/attendance/close/${sessionId}`, {
      method: 'POST',
    });
  }

  async getActiveSession() {
    return this.request('/attendance/active');
  }

  async markAttendance(sessionId, latitude, longitude) {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({ sessionId, latitude, longitude }),
    });
  }

  async getHistory() {
    return this.request('/attendance/history');
  }

  async getSession(sessionId) {
    return this.request(`/attendance/session/${sessionId}`);
  }

  async getAllSessions() {
    return this.request('/attendance/sessions');
  }

  async getStats() {
    return this.request('/stats/overview');
  }
}

export default new ApiService();
