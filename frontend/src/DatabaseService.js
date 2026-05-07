import api from './api';

const DatabaseService = {
  async getProjects() {
    return api.get('/data/projects');
  },
  async getTasks() {
    return api.get('/data/tasks');
  },
  async getDailyTasks() {
    return api.get('/data/daily');
  },
  async getLaunchItems() {
    return api.get('/data/launch');
  },

  async addProject(id, project) {
    return api.post('/data/projects', project);
  },

  async updateProject(id, oldProject, newProject) {
    return api.put(`/data/projects/${oldProject.name}/${oldProject.version}`, newProject);
  },

  async deleteProject(id, name, version) {
    return api.delete(`/data/projects/${name}/${version}`);
  },

  async deleteProjectCluster(id, name) {
    return api.delete(`/data/projects/${name}`);
  },

  async closeProject(id, name, version) {
    return api.post('/data/projects/close', { name, version });
  },

  async updateCoordinators(id, name, version, coordinators) {
    return api.post('/data/projects/coordinators', { name, version, coordinators });
  },

  async removeCoordinator(id, name, version, email) {
    return api.delete('/data/projects/coordinators', { data: { name, version, email } });
  },

  async addTask(id, task) {
    return api.post('/data/tasks', task);
  },

  async deleteTask(id, task) {
    return api.delete('/data/tasks', { data: task });
  },

  async updateTaskStatus(id, task, status) {
    return api.post('/data/tasks/status', { task, status });
  },
  
  async updateTask(id, task, updatedData) {
    return api.put(`/data/tasks/${task._id}`, updatedData);
  },

  async updateSubtaskStatus(id, task, subtaskName, status) {
    return api.post('/data/tasks/subtask/status', { task, subtaskName, status });
  },

  async addDailyTask(id, name, priority) {
    return api.post('/data/daily', { name, priority });
  },

  async updateDailyStatus(id, name, status) {
    return api.post('/data/daily/status', { name, status });
  },

  async deleteDailyTask(id, name) {
    return api.delete(`/data/daily/${name}`);
  },

  async addLaunchItem(id, item) {
    return api.post('/data/launch', item);
  },

  async deleteLaunchItem(id, itemId) {
    return api.delete(`/data/launch/${itemId}`);
  },

  async updateLaunchItem(id, itemId, updatedData) {
    return api.put(`/data/launch/${itemId}`, updatedData);
  }
};

export default DatabaseService;
