require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ───────────────────────────────────────────────────────────────────
// ALLOWED_ORIGIN can be:
//   *                          → allow all (good for dev / public API)
//   a single domain            → e.g. https://videocallapp-2ee79.web.app
//   comma-separated domains    → e.g. https://a.web.app,https://b.web.app
// On Render.com set ALLOWED_ORIGIN to '*' so any browser can fetch a token.
const rawAllowedOrigin = process.env.ALLOWED_ORIGIN || '*';

// Build a list of allowed origins from a comma-separated string
const allowedOrigins = rawAllowedOrigin === '*'
  ? '*'
  : rawAllowedOrigin.split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    // Allow wildcard
    if (allowedOrigins === '*') return callback(null, true);
    // Allow if the request origin is in the list
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Reject everything else
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  methods: ['GET', 'OPTIONS'],
}));

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Agora Token Server', version: '1.0.0' });
});

// ─── Generate Agora RTC Token ─────────────────────────────────────────────────
// GET /generateAgoraToken?channelName=xxx&uid=0
app.get('/generateAgoraToken', (req, res) => {
  const appID          = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appID || !appCertificate) {
    return res.status(500).json({ error: 'Agora credentials missing on server.' });
  }

  const { channelName } = req.query;
  if (!channelName) {
    return res.status(400).json({ error: 'channelName query param is required.' });
  }

  // uid: 0 means Agora assigns a uid automatically
  let uid = req.query.uid;
  if (!uid || uid === '') {
    uid = 0;
  } else {
    // Only convert to integer if it strictly contains only digits (numeric UID mode)
    uid = /^\d+$/.test(uid) ? parseInt(uid, 10) : uid;
  }

  const role                  = RtcRole.PUBLISHER;
  const expirationTimeSeconds = 7200; // 2 hours
  const privilegeExpiredTs    = Math.floor(Date.now() / 1000) + expirationTimeSeconds;

  try {
    let token;
    if (typeof uid === 'string') {
      token = RtcTokenBuilder.buildTokenWithUserAccount(
        appID, appCertificate, channelName, uid, role, privilegeExpiredTs
      );
    } else {
      token = RtcTokenBuilder.buildTokenWithUid(
        appID, appCertificate, channelName, uid, role, privilegeExpiredTs
      );
    }
    return res.json({ token, channelName, uid });
  } catch (err) {
    console.error('Token generation error:', err);
    return res.status(500).json({ error: 'Failed to generate token.' });
  }
});

// ─── 404 fallback ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Agora Token Server running on port ${PORT}`);
  console.log(`   GET /generateAgoraToken?channelName=<name>&uid=<uid>`);
});
