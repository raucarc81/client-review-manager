// ─────────────────────────────────────────────────────────────────────────────
// send-reminders.js
// Ejecutado automáticamente cada mañana por GitHub Actions.
// Lee clients.json, comprueba fechas y envía emails via Resend API.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = 'nadia.mazzoli@arthrex.es';

if (!RESEND_API_KEY) {
  console.error('❌ Error: No se encontró RESEND_API_KEY en los secrets de GitHub.');
  console.error('   Ve a Settings → Secrets → New secret → RESEND_API_KEY');
  process.exit(1);
}

// ── Cargar clientes ───────────────────────────────────────────────────────────
let clients = [];
try {
  clients = JSON.parse(fs.readFileSync('clients.json', 'utf-8'));
} catch (e) {
  console.log('ℹ️  clients.json vacío o no encontrado. Sin clientes que revisar.');
  process.exit(0);
}

if (!clients.length) {
  console.log('ℹ️  No hay clientes registrados todavía.');
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

function statusColor(days) {
  if (days <= 0) return '#dc2626';
  if (days <= 7) return '#dc2626';
  if (days <= 14) return '#d97706';
  return '#2563eb';
}

function statusText(days) {
  if (days <= 0) return `¡VENCIDO hace ${Math.abs(days)} día${Math.abs(days) !== 1 ? 's' : ''}!`;
  if (days === 0) return '¡HOY!';
  return `En ${days} día${days !== 1 ? 's' : ''}`;
}

// ── Plantilla HTML del email ──────────────────────────────────────────────────
function buildEmailHtml(client, daysUntil) {
  const reviewDate = formatDate(client.nextReviewDate);
  const lastDate = formatDate(client.lastNegotiationDate);
  const color = statusColor(daysUntil);
  const status = statusText(daysUntil);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; padding: 24px; }
  .wrap { max-width: 580px; margin: 0 auto; }
  .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: #0f172a; padding: 28px 32px; }
  .header-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
  .logo { font-size: 13px; color: #94a3b8; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
  .badge { background: ${color}; color: #fff; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 20px; white-space: nowrap; margin-top: 2px; }
  .header h1 { color: #f8fafc; font-size: 20px; font-weight: 700; margin-top: 16px; line-height: 1.3; }
  .header p { color: #94a3b8; font-size: 13px; margin-top: 6px; }
  .body { padding: 28px 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
  .field { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
  .field:nth-child(odd) { padding-right: 20px; }
  .field-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 3px; }
  .field-value { font-size: 14px; color: #0f172a; font-weight: 500; }
  .highlight-box { border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .hl-blue { background: #eff6ff; border-left: 4px solid #2563eb; }
  .hl-amber { background: #fffbeb; border-left: 4px solid #d97706; }
  .hl-red { background: #fef2f2; border-left: 4px solid #dc2626; }
  .hl-label { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .hl-value { font-size: 26px; font-weight: 800; color: #2563eb; }
  .hl-amber .hl-value { color: #d97706; }
  .hl-red .hl-value { color: #dc2626; }
  .notes-box { background: #f8fafc; border-radius: 8px; padding: 14px 16px; margin-top: 16px; }
  .notes-box p { font-size: 13px; color: #4b5563; line-height: 1.6; }
  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header">
      <div class="header-top">
        <span class="logo">Client Review Manager · Arthrex</span>
        <span class="badge">${status}</span>
      </div>
      <h1>⚠️ Revisión de precios pendiente</h1>
      <p>Este aviso se ha generado automáticamente. Fecha de revisión: <strong style="color:#e2e8f0">${reviewDate}</strong></p>
    </div>
    <div class="body">
      <div class="grid">
        <div class="field">
          <div class="field-label">Cliente</div>
          <div class="field-value">${client.name}</div>
        </div>
        <div class="field">
          <div class="field-label">Empresa</div>
          <div class="field-value">${client.company || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Contacto</div>
          <div class="field-value">${client.contactName || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Email contacto</div>
          <div class="field-value" style="font-size:12px">${client.contactEmail || '—'}</div>
        </div>
        <div class="field">
          <div class="field-label">Última negociación</div>
          <div class="field-value">${lastDate}</div>
        </div>
        <div class="field">
          <div class="field-label">Fecha de revisión</div>
          <div class="field-value" style="color:${color}; font-weight:700">${reviewDate}</div>
        </div>
      </div>

      <div class="highlight-box hl-blue">
        <div class="hl-label">Descuento actual negociado</div>
        <div class="hl-value">${client.currentDiscount ?? 0}%</div>
      </div>

      <div class="highlight-box hl-amber">
        <div class="hl-label">Subida de precio planificada</div>
        <div class="hl-value">+${client.plannedIncrease ?? 0}%</div>
      </div>

      ${client.notes ? `
      <div class="notes-box">
        <div class="field-label" style="margin-bottom:6px">Notas</div>
        <p>${client.notes}</p>
      </div>` : ''}
    </div>
    <div class="footer">
      <span>Generado automáticamente · ${new Date().toLocaleDateString('es-ES')}</span>
      <span>Client Review Manager · Arthrex</span>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ── Enviar email via Resend API ────────────────────────────────────────────────
async function sendEmail(client, daysUntil) {
  const status = statusText(daysUntil);
  const subject = daysUntil <= 0
    ? `🔴 VENCIDO: Revisión de precios — ${client.name}`
    : daysUntil <= 7
    ? `🔴 URGENTE (${daysUntil}d): Revisión de precios — ${client.name}`
    : `⚠️ Revisión de precios en ${daysUntil} días — ${client.name}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Client Review Manager <onboarding@resend.dev>',
      to: [TO_EMAIL],
      subject,
      html: buildEmailHtml(client, daysUntil)
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${res.status} — ${err}`);
  }
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log(`📅 Comprobando revisiones — ${today.toLocaleDateString('es-ES')}`);
  console.log(`👥 Total clientes: ${clients.length}`);
  console.log('─'.repeat(50));

  let sent = 0;
  let skipped = 0;

  for (const client of clients) {
    if (!client.nextReviewDate) { skipped++; continue; }

    const reviewDate = new Date(client.nextReviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((reviewDate - today) / 86400000);
    const alertDays = client.alertDaysBefore || 30;

    if (daysUntil <= alertDays) {
      try {
        await sendEmail(client, daysUntil);
        sent++;
        console.log(`✅ Email enviado: ${client.name} — ${daysUntil <= 0 ? 'VENCIDO' : `${daysUntil} días`}`);
      } catch (e) {
        console.error(`❌ Error con ${client.name}: ${e.message}`);
      }
    } else {
      skipped++;
      console.log(`⏭️  Sin aviso: ${client.name} — faltan ${daysUntil} días`);
    }
  }

  console.log('─'.repeat(50));
  console.log(`📧 Emails enviados: ${sent}`);
  console.log(`⏭️  Clientes sin aviso hoy: ${skipped}`);
}

main().catch(e => {
  console.error('Error fatal:', e);
  process.exit(1);
});
