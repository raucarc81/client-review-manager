# 📋 Client Review Manager — Arthrex

Aplicación de escritorio Windows 11 para gestión de revisiones de precios de clientes.

---

## 🚀 Instalación Rápida

### Requisitos
- **Node.js** v18 o superior → https://nodejs.org
- **Windows 11** (64-bit)

### Pasos

```bash
# 1. Descomprime la carpeta del proyecto
# 2. Abre una terminal (CMD o PowerShell) en la carpeta
# 3. Instala las dependencias:
npm install

# 4. Para ejecutar en modo desarrollo:
npm start

# 5. Para compilar el instalador .exe para Windows:
npm run build
```

El instalador `.exe` se generará en la carpeta `dist/`.

---

## 📦 Qué genera `npm run build`

- `dist/Client Review Manager Setup 1.0.0.exe` → Instalador con menú inicio y acceso directo
- `dist/Client Review Manager 1.0.0.exe` → Versión portable (sin instalar)

---

## ✉️ Configuración de Email (SMTP)

Para que los avisos automáticos funcionen, configura el SMTP desde la app:

**⚙️ Configurar Email → Servidor SMTP**

| Campo | Gmail | Office 365 |
|-------|-------|------------|
| Servidor | smtp.gmail.com | smtp.office365.com |
| Puerto | 587 | 587 |
| SSL | No (usar TLS) | No |

> **Gmail**: Activa verificación en dos pasos y crea una "Contraseña de aplicación" en myaccount.google.com → Seguridad → Contraseñas de aplicaciones.

---

## 💾 Dónde se guardan los datos

Los datos se guardan localmente en:
```
C:\Users\[TuUsuario]\AppData\Roaming\client-review-manager\
├── clients.json     → Datos de clientes
└── email-config.json → Configuración SMTP
```

---

## 🛠️ Funcionalidades

- ✅ Gestión completa de clientes (CRUD)
- ✅ Fechas de última negociación y próxima revisión
- ✅ Porcentaje de descuento actual y subida planificada
- ✅ Avisos configurables por cliente (días de antelación)
- ✅ Envío automático de emails a nadia.mazzoli@arthrex.es
- ✅ Exportación a Excel (.xlsx) con todos los datos
- ✅ Filtros por estado: urgente, próximos 30 días, al día
- ✅ Panel de detalle lateral por cliente
- ✅ Búsqueda en tiempo real
- ✅ Diseño CRM profesional oscuro

---

## 📊 Estados de revisión

| Estado | Color | Descripción |
|--------|-------|-------------|
| 🔴 Urgente | Rojo | ≤ 7 días para la revisión |
| ⚠️ Próximo | Amarillo | 8-30 días |
| ✅ Al día | Verde | > 30 días |
| ⚠️ Vencido | Rojo | Fecha de revisión pasada |
