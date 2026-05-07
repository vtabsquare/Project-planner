import api from './api';

const SheetsService = {
  async getAuthUrl() {
    const { url } = await api.get('/auth/url');
    return url;
  },

  async login(email, password) {
    return api.post('/auth/login', { email, password });
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getProfile() {
    return api.get('/auth/me');
  },

  async findSpreadsheet() {
    return api.get('/sheets/find');
  },

  async createSpreadsheet() {
    return api.post('/sheets/create');
  },

  async getData(spreadsheetId, range) {
    return api.get(`/sheets/data/${spreadsheetId}/${range}`);
  },

  async appendData(spreadsheetId, range, values) {
    return api.post(`/sheets/data/${spreadsheetId}/${range}`, { values });
  },

  async updateTaskStatus(spreadsheetId, sheetName, rowData, newStatus) {
    return api.post('/sheets/update-task', { spreadsheetId, sheetName, rowData, newStatus });
  },

  async updateDailyStatus(spreadsheetId, taskName, newStatus) {
    return api.post('/sheets/update-daily', { spreadsheetId, taskName, newStatus });
  },

  async getUsers() {
    return api.get('/auth/users');
  },

  async createUser(userData) {
    return api.post('/auth/users', userData);
  },

  async deleteUser(userId) {
    return api.delete(`/auth/users/${userId}`);
  },
  
  async updateUser(userId, userData) {
    return api.put(`/auth/users/${userId}`, userData);
  },

  // Launchpad Methods for Sheets (if implemented on backend)
  async getLaunchItems() {
    return api.get('/sheets/launch');
  },

  async addLaunchItem(spreadsheetId, item) {
    return api.post('/sheets/launch', { spreadsheetId, ...item });
  },

  async updateLaunchItem(spreadsheetId, itemId, item) {
    return api.put(`/sheets/launch/${itemId}`, { spreadsheetId, ...item });
  },

  async deleteLaunchItem(spreadsheetId, itemId) {
    return api.delete(`/sheets/launch/${itemId}`, { data: { spreadsheetId } });
  }
};

export default SheetsService;
