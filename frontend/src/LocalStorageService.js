const STORAGE_KEYS = {
  PROJECTS: 'aether_local_projects',
  TASKS: 'aether_local_tasks',
  DAILY: 'aether_local_daily',
  LAUNCH: 'aether_local_launch'
};

const LocalStorageService = {
  async getProjects() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROJECTS) || '[]');
  },
  async getTasks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  },
  async getDailyTasks() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY) || '[]');
  },
  async getLaunchItems() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LAUNCH) || '[]');
  },

  async addProject(id, project) {
    const projects = await this.getProjects();
    const newProject = { 
      ...project, 
      createdAt: new Date().toISOString(),
      status: 'Active'
    };
    projects.push(newProject);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return newProject;
  },

  async updateProject(id, oldProject, newProject) {
    let projects = await this.getProjects();
    projects = projects.map(p => (p.name === oldProject.name && p.version === oldProject.version) ? { ...p, ...newProject } : p);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  async deleteProject(id, name, version) {
    let projects = await this.getProjects();
    projects = projects.filter(p => !(p.name === name && p.version === version));
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    let tasks = await this.getTasks();
    tasks = tasks.filter(t => !(t.project === name && t.version === version));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  async deleteProjectCluster(id, name) {
    let projects = await this.getProjects();
    projects = projects.filter(p => p.name !== name);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    
    let tasks = await this.getTasks();
    tasks = tasks.filter(t => t.project !== name);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  async closeProject(id, name, version) {
    let projects = await this.getProjects();
    projects = projects.map(p => {
      if (p.name === name && p.version === version) {
        const isClosing = p.status !== 'Closed';
        return { 
          ...p, 
          status: isClosing ? 'Closed' : 'Active', 
          finalizedAt: isClosing ? new Date().toISOString() : null 
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  async addTask(id, task) {
    const tasks = await this.getTasks();
    const newTask = { 
      ...task, 
      createdAt: new Date().toISOString(),
      history: [{ status: 'Open', timestamp: new Date().toISOString() }]
    };
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  },

  async updateTask(id, oldTask, newTask) {
    let tasks = await this.getTasks();
    tasks = tasks.map(t => (t.name === oldTask.name && t.project === oldTask.project && t.version === oldTask.version) ? { ...t, ...newTask } : t);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  async deleteTask(id, task) {
    let tasks = await this.getTasks();
    tasks = tasks.filter(t => !(t.name === task.name && t.project === task.project && t.version === task.version));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  async updateTaskStatus(id, task, status) {
    let tasks = await this.getTasks();
    tasks = tasks.map(t => {
      if (t.name === task.name && t.project === task.project && t.version === task.version) {
        const history = t.history || [];
        return { 
          ...t, 
          status, 
          completedAt: status === 'Completed' ? new Date().toISOString() : t.completedAt,
          history: [...history, { status, timestamp: new Date().toISOString() }]
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  async addDailyTask(id, name, priority) {
    const daily = await this.getDailyTasks();
    const newTask = { 
      name, 
      priority, 
      status: 'Open', 
      createdAt: new Date().toISOString() 
    };
    daily.push(newTask);
    localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(daily));
    return newTask;
  },

  async updateDailyStatus(id, name, status) {
    let daily = await this.getDailyTasks();
    daily = daily.map(d => d.name === name ? { 
      ...d, 
      status, 
      completedAt: status === 'Completed' ? new Date().toISOString() : d.completedAt 
    } : d);
    localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(daily));
  },

  async deleteDailyTask(id, name) {
    let daily = await this.getDailyTasks();
    daily = daily.filter(d => d.name !== name);
    localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(daily));
  },

  async addLaunchItem(id, item) {
    const items = await this.getLaunchItems();
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    items.push(newItem);
    localStorage.setItem(STORAGE_KEYS.LAUNCH, JSON.stringify(items));
    return newItem;
  },

  async deleteLaunchItem(id, itemId) {
    let items = await this.getLaunchItems();
    items = items.filter(i => i.id !== itemId);
    localStorage.setItem(STORAGE_KEYS.LAUNCH, JSON.stringify(items));
  },

  async updateLaunchItem(id, itemId, updatedData) {
    let items = await this.getLaunchItems();
    items = items.map(i => i.id === itemId ? { ...i, ...updatedData } : i);
    localStorage.setItem(STORAGE_KEYS.LAUNCH, JSON.stringify(items));
  }
};

export default LocalStorageService;
