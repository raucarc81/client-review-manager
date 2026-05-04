const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');

// ─── Paths ────────────────────────────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'clients.json');
const configFilePath = path.join(userDataPath, 'email-config.json');

// ─── Data helpers ─────────────────────────────────────────────────────────────
function readClients() {
  try {
    if (!fs.existsSync(dataFilePath)) return [];
    const raw = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
}

function writeClients(clients) {
  fs.writeFileSync(dataFilePath, JSON.stringify(clients, null, 2), 'utf-8');
}

function readEmailConfig() {
  try {
    if (!fs.existsSync(configFilePath)) return null;
    return JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
  } catch { return null; }
}

function writeEmailConfig(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
}

// ─── Email helper ─────────────────────────────────────────────────────────────
function createTransporter(cfg) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass }
  });
}

async function sendReviewEmail(client, cfg) {
  const transporter = createTransporter(cfg);
  const reviewDate = new Date(client.nextReviewDate).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const lastDate = new Date(client.lastNegotiationDate).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  const daysUntil = Math.ceil((new Date(client.nextReviewDate) - new Date()) / (1000 * 60 * 60 * 24));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #1e3a5f; color: #fff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
    .header p { margin: 6px 0 0; color: #a8c4e0; font-size: 14px; }
    .badge { display: inline-block; background: ${daysUntil <= 7 ? '#dc2626' : daysUntil <= 14 ? '#d97706' : '#2563eb'}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .body { padding: 32px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 0 0 4px; }
    .value { font-size: 16px; color: #111827; font-weight: 500; margin: 0 0 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; }
    .highlight { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 0 6px 6px 0; margin: 20px 0; }
    .highlight .label { font-size: 12px; color: #4b5563; }
    .highlight .pct { font-size: 28px; font-weight: 700; color: #2563eb; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Revisión de Precios Próxima</h1>
      <p>Client Review Manager · Arthrex</p>
      <span class="badge">${daysUntil <= 0 ? '¡HOY!' : `En ${daysUntil} día${daysUntil === 1 ? '' : 's'}`}</span>
    </div>
    <div class="body">
      <div class="grid">
        <div>
          <p class="section-title">Cliente</p>
          <p class="value">${client.name}</p>
        </div>
        <div>
          <p class="section-title">Empresa</p>
          <p class="value">${client.company || '—'}</p>
        </div>
        <div>
          <p class="section-title">Contacto</p>
          <p class="value">${client.contactName || '—'}</p>
        </div>
        <div>
          <p class="section-title">Email Contacto</p>
          <p class="value">${client.contactEmail || '—'}</p>
        </div>
        <div>
          <p class="section-title">Última Negociación</p>
          <p class="value">${lastDate}</p>
        </div>
        <div>
          <p class="section-title">Fecha de Revisión</p>
          <p class="value" style="color:${daysUntil <= 7 ? '#dc2626' : '#111827'}">${reviewDate}</p>
        </div>
      </div>
      <div class="highlight">
        <div class="label">Descuento actual negociado</div>
        <div class="pct">${client.currentDiscount}%</div>
      </div>
      <div class="highlight" style="background:#fff8f0; border-left-color:#d97706;">
        <div class="label">Subida de precio planificada</div>
        <div class="pct" style="color:#d97706;">+${client.plannedIncrease}%</div>
      </div>
      ${client.notes ? `<p class="section-title">Notas</p><p class="value" style="font-size:14px; color:#4b5563;">${client.notes}</p>` : ''}
    </div>
    <div class="footer">
      Este aviso ha sido generado automáticamente por Client Review Manager.<br>
      Arthrex · ${new Date().toLocaleDateString('es-ES')}
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Client Review Manager" <${cfg.user}>`,
    to: 'nadia.mazzoli@arthrex.es',
    subject: `⚠️ Revisión de precios: ${client.name} — ${reviewDate}`,
    html
  });
}

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0d1117',
    show: false,
    titleBarStyle: 'default',
    icon: path.join(__dirname, 'src/assets/icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, 'src/index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  // Check reviews on startup after 3 seconds
  setTimeout(() => checkAndNotify(), 3000);
  // Check every 6 hours while running
  setInterval(() => checkAndNotify(), 6 * 60 * 60 * 1000);
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ─── Startup review check ─────────────────────────────────────────────────────
async function checkAndNotify() {
  const clients = readClients();
  const cfg = readEmailConfig();
  const today = new Date();

  const urgent = clients.filter(c => {
    if (!c.nextReviewDate) return false;
    const days = Math.ceil((new Date(c.nextReviewDate) - today) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= (c.alertDaysBefore || 30);
  });

  if (urgent.length > 0 && mainWindow) {
    mainWindow.webContents.send('notification', {
      type: 'upcoming-reviews',
      count: urgent.length,
      clients: urgent
    });
  }

  if (cfg && cfg.autoSend) {
    for (const client of urgent) {
      try { await sendReviewEmail(client, cfg); } catch (e) { console.error('Email error:', e.message); }
    }
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-clients', () => readClients());

ipcMain.handle('save-client', (_, client) => {
  const clients = readClients();
  const { v4: uuidv4 } = require('uuid');
  if (client.id) {
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx !== -1) {
      clients[idx] = { ...client, updatedAt: new Date().toISOString() };
    } else {
      clients.push({ ...client, updatedAt: new Date().toISOString() });
    }
  } else {
    clients.push({ ...client, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  writeClients(clients);
  return { success: true };
});

ipcMain.handle('delete-client', (_, id) => {
  const clients = readClients().filter(c => c.id !== id);
  writeClients(clients);
  return { success: true };
});

ipcMain.handle('get-email-config', () => readEmailConfig());

ipcMain.handle('save-email-config', (_, config) => {
  writeEmailConfig(config);
  return { success: true };
});

ipcMain.handle('test-email', async (_, config) => {
  try {
    const t = createTransporter(config);
    await t.verify();
    await t.sendMail({
      from: `"Client Review Manager" <${config.user}>`,
      to: 'nadia.mazzoli@arthrex.es',
      subject: '✅ Test - Client Review Manager',
      html: '<p>Conexión de correo configurada correctamente.</p>'
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('send-reminder-email', async (_, clientId) => {
  const clients = readClients();
  const client = clients.find(c => c.id === clientId);
  const cfg = readEmailConfig();
  if (!client || !cfg) return { success: false, error: 'Cliente o configuración no encontrada' };
  try {
    await sendReviewEmail(client, cfg);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('check-upcoming-reviews', () => {
  const clients = readClients();
  const today = new Date();
  return clients.map(c => ({
    ...c,
    daysUntilReview: c.nextReviewDate
      ? Math.ceil((new Date(c.nextReviewDate) - today) / (1000 * 60 * 60 * 24))
      : null
  }));
});

ipcMain.handle('export-to-excel', async () => {
  const clients = readClients();
  const { dialog } = require('electron');
  const savePath = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar a Excel',
    defaultPath: `clientes_revisiones_${new Date().toISOString().slice(0, 10)}.xlsx`,
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });

  if (savePath.canceled) return { success: false, canceled: true };

  const today = new Date();
  const rows = clients.map(c => ({
    'Cliente': c.name,
    'Empresa': c.company || '',
    'Contacto': c.contactName || '',
    'Email Contacto': c.contactEmail || '',
    'Teléfono': c.contactPhone || '',
    'Última Negociación': c.lastNegotiationDate
      ? new Date(c.lastNegotiationDate).toLocaleDateString('es-ES') : '',
    'Próxima Revisión': c.nextReviewDate
      ? new Date(c.nextReviewDate).toLocaleDateString('es-ES') : '',
    'Días para Revisión': c.nextReviewDate
      ? Math.ceil((new Date(c.nextReviewDate) - today) / (1000 * 60 * 60 * 24)) : '',
    'Descuento Actual (%)': c.currentDiscount || 0,
    'Subida Planificada (%)': c.plannedIncrease || 0,
    'Días de Aviso': c.alertDaysBefore || 30,
    'Notas': c.notes || '',
    'Creado': c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-ES') : ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 18 },
    { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
    { wch: 14 }, { wch: 40 }, { wch: 16 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, savePath.filePath);
  return { success: true, path: savePath.filePath };
});
