import SheetsService from './SheetsService';
import LocalStorageService from './LocalStorageService';
import DatabaseService from './DatabaseService';

export class DataService {
  static instance;
  source = localStorage.getItem('aether_source') || 'local';

  static getInstance() {
    if (!this.instance) {
      this.instance = new DataService();
    }
    return this.instance;
  }

  setSource(source) {
    this.source = source;
    localStorage.setItem('aether_source', source);
  }

  getService() {
    switch (this.source) {
      case 'sheets': return SheetsService;
      case 'database': return DatabaseService;
      default: return LocalStorageService;
    }
  }

  async getData() {
    const service = this.getService();
    const spreadsheetId = localStorage.getItem('aether_spreadsheet_id');

    try {
      if (this.source === 'sheets') {
        if (!spreadsheetId) return { projects: [], tasks: [], dailyTasks: [], launchItems: [] };
        
        // Fetch all sheets data in parallel for performance
        const [projects, tasks, dailyTasks, launchItems] = await Promise.all([
          service.getData(spreadsheetId, 'Projects!A2:E').catch(() => []),
          service.getData(spreadsheetId, 'Tasks!A2:H').catch(() => []),
          service.getData(spreadsheetId, 'Daily!A2:D').catch(() => []),
          service.getLaunchItems ? service.getLaunchItems(spreadsheetId).catch(() => []) : []
        ]);
        
        return { 
          projects: Array.isArray(projects) ? projects : [], 
          tasks: Array.isArray(tasks) ? tasks : [], 
          dailyTasks: Array.isArray(dailyTasks) ? dailyTasks : [],
          launchItems: Array.isArray(launchItems) ? launchItems : []
        };
      } else {
        // Local Storage or Database
        const [projects, tasks, dailyTasks, launchItems] = await Promise.all([
          service.getProjects().catch(() => []),
          service.getTasks().catch(() => []),
          service.getDailyTasks().catch(() => []),
          service.getLaunchItems().catch(() => [])
        ]);
        
        return { 
          projects: Array.isArray(projects) ? projects : (projects?.data || []), 
          tasks: Array.isArray(tasks) ? tasks : (tasks?.data || []), 
          dailyTasks: Array.isArray(dailyTasks) ? dailyTasks : (dailyTasks?.data || []),
          launchItems: Array.isArray(launchItems) ? launchItems : (launchItems?.data || [])
        };
      }
    } catch (error) {
      console.error('DataService Fetch Error:', error);
      return { projects: [], tasks: [], dailyTasks: [], launchItems: [] };
    }
  }
}

export default DataService;
