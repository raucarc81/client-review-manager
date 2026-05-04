const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Clients
  getClients: () => ipcRenderer.invoke('get-clients'),
  saveClient: (client) => ipcRenderer.invoke('save-client', client),
  deleteClient: (id) => ipcRenderer.invoke('delete-client', id),

  // Email config
  getEmailConfig: () => ipcRenderer.invoke('get-email-config'),
  saveEmailConfig: (config) => ipcRenderer.invoke('save-email-config', config),
  testEmail: (config) => ipcRenderer.invoke('test-email', config),
  sendReminderEmail: (clientId) => ipcRenderer.invoke('send-reminder-email', clientId),

  // Export
  exportToExcel: () => ipcRenderer.invoke('export-to-excel'),

  // Notifications
  onNotification: (callback) => ipcRenderer.on('notification', (_, data) => callback(data)),

  // Check reviews
  checkUpcomingReviews: () => ipcRenderer.invoke('check-upcoming-reviews')
});
