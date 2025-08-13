// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',        // Vite dev
    'http://localhost:3000',        // CRA dev
    'https://innovatechai.io/' // <- replace with your real domain
  ],
  methods: ['POST']
}));
app.use(express.json());

// Transporter (Gmail App Password or other SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
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
      from: `"InnovaTech AI Website" <${process.env.MAIL_USER}>`,
      replyTo: email,
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      subject: `Contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('Email send error:', e);
    res.status(500).json({ ok: false, error: 'Send failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on ${PORT}`));
