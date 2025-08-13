
// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

// --- CORS ---
// NOTE: remove the trailing slash from your domain.
app.use(cors({
  origin: [
    'http://localhost:5173',      // Vite dev
    'http://localhost:3000',      // CRA dev
    'https://innovatechai.io'     // your Hostinger domain (no trailing /)
  ],
  methods: ['POST'],
}));

app.use(express.json());

// --- Hostinger SMTP transporter ---
/*
  Required env vars on Render (Settings → Environment):
    MAIL_HOST=smtp.hostinger.com
    MAIL_PORT=465            # 465 for SSL, or 587 for STARTTLS
    MAIL_USER=you@innovatechai.io
    MAIL_PASS=your_hostinger_email_password
    MAIL_FROM=you@innovatechai.io   # optional; defaults to MAIL_USER
    MAIL_TO=you@innovatechai.io     # optional; defaults to MAIL_USER
    SMTP_SECURE=true                # "true" for 465, "false" for 587
*/
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 465),
  secure: String(process.env.SMTP_SECURE || 'true') === 'true', // true for 465 SSL
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  // If your provider needs it, uncomment the next line:
  // tls: { rejectUnauthorized: false },
});

// Health check
app.get('/health', (_req, res) => res.send('ok'));

// Contact endpoint
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ ok: false, error: 'Missing fields' });
  }

  try {
    await transporter.sendMail({
      from: `${process.env.MAIL_FROM || process.env.MAIL_USER}`, // must be your Hostinger mailbox
      replyTo: email,                                            // visitor’s email
      to: process.env.MAIL_TO || process.env.MAIL_USER,          // where you receive mail
      subject: `Contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    res.json({ ok: true });
  } catch (e) {
    console.error('Email send error:', e?.message || e);
    res.status(500).json({ ok: false, error: e?.message || 'Send failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));
