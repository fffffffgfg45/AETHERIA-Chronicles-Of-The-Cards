import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, {Response} from 'express';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {GoogleGenAI} from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Parse JSON request bodies for API routes
app.use(express.json({ limit: '10mb' }));

/**
 * =========================================================================
 * REAL-TIME CONCURRENT PLAYERS PRESENCE ENGINE (SSE + Beacon/Heartbeat)
 * =========================================================================
 */
interface PresenceSession {
  sessionId: string;
  playerName: string;
  heroClass: string;
  currentView: string;
  connectedAt: number;
  lastSeenAt: number;
  res: Response;
  pingTimer: ReturnType<typeof setInterval>;
}

const activeSessions = new Map<string, PresenceSession>();
let peakOnlineCount = 0;

function sanitizePresenceField(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[<>]/g, '').trim();
  return cleaned.length > 0 ? cleaned.slice(0, maxLength) : fallback;
}

function buildPresenceSnapshot() {
  const players = Array.from(activeSessions.values())
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .slice(0, 30)
    .map(s => ({
      sessionId: s.sessionId,
      playerName: s.playerName,
      heroClass: s.heroClass,
      currentView: s.currentView,
      connectedAt: s.connectedAt,
    }));

  return {
    onlineCount: activeSessions.size,
    peakOnlineCount,
    updatedAt: Date.now(),
    players,
  };
}

function broadcastPresence() {
  const payload = `event: presence\ndata: ${JSON.stringify(buildPresenceSnapshot())}\n\n`;
  for (const [id, session] of activeSessions.entries()) {
    try {
      if (!session.res.writableEnded) {
        session.res.write(payload);
      }
    } catch {
      clearInterval(session.pingTimer);
      activeSessions.delete(id);
    }
  }
}

function removePresenceSession(sessionId: string, expectedRes?: Response) {
  const existing = activeSessions.get(sessionId);
  if (!existing) return false;
  if (expectedRes && existing.res !== expectedRes) {
    return false;
  }
  clearInterval(existing.pingTimer);
  activeSessions.delete(sessionId);
  if (expectedRes === undefined && !existing.res.writableEnded) {
    try {
      existing.res.end();
    } catch {
      // Ignore already-closed stream errors
    }
  }
  return true;
}

// Reap stale silent connections (e.g. abrupt network drop without TCP close)
const staleReaper = setInterval(() => {
  const now = Date.now();
  let removed = false;
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.lastSeenAt > 75_000 || session.res.writableEnded) {
      clearInterval(session.pingTimer);
      activeSessions.delete(id);
      removed = true;
    }
  }
  if (removed) {
    broadcastPresence();
  }
}, 30_000);
staleReaper.unref();

app.get('/api/presence', (_req, res) => {
  res.json(buildPresenceSnapshot());
});

app.get('/api/presence/stream', (req, res) => {
  const sessionId = sanitizePresenceField(req.query['sessionId'], randomUUID(), 80);
  const playerName = sanitizePresenceField(req.query['playerName'], 'Aventurier', 40);
  const heroClass = sanitizePresenceField(req.query['heroClass'], 'paladin', 24);
  const currentView = sanitizePresenceField(req.query['currentView'], 'Arène', 40);

  // Replace any previous open SSE stream for this exact tab sessionId cleanly
  const previous = activeSessions.get(sessionId);
  if (previous) {
    clearInterval(previous.pingTimer);
    activeSessions.delete(sessionId);
    if (!previous.res.writableEnded) {
      try {
        previous.res.end();
      } catch {
        // Ignore
      }
    }
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const now = Date.now();
  const pingTimer = setInterval(() => {
    const current = activeSessions.get(sessionId);
    if (!current || current.res !== res || res.writableEnded) {
      clearInterval(pingTimer);
      return;
    }
    current.lastSeenAt = Date.now();
    try {
      res.write(': ping\n\n');
    } catch {
      if (removePresenceSession(sessionId, res)) {
        broadcastPresence();
      }
    }
  }, 20_000);
  pingTimer.unref();

  activeSessions.set(sessionId, {
    sessionId,
    playerName,
    heroClass,
    currentView,
    connectedAt: previous?.connectedAt ?? now,
    lastSeenAt: now,
    res,
    pingTimer,
  });

  if (activeSessions.size > peakOnlineCount) {
    peakOnlineCount = activeSessions.size;
  }

  broadcastPresence();

  req.on('close', () => {
    if (removePresenceSession(sessionId, res)) {
      broadcastPresence();
    }
  });
});

app.post('/api/presence/update', (req, res) => {
  const sessionId = sanitizePresenceField(req.body?.sessionId, '', 80);
  if (!sessionId) {
    return res.status(400).json({ ok: false, error: 'Missing sessionId' });
  }
  const existing = activeSessions.get(sessionId);
  if (!existing) {
    return res.json({ ok: false, onlineCount: activeSessions.size });
  }

  const nextName = req.body?.playerName !== undefined
    ? sanitizePresenceField(req.body.playerName, existing.playerName, 40)
    : existing.playerName;
  const nextHero = req.body?.heroClass !== undefined
    ? sanitizePresenceField(req.body.heroClass, existing.heroClass, 24)
    : existing.heroClass;
  const nextView = req.body?.currentView !== undefined
    ? sanitizePresenceField(req.body.currentView, existing.currentView, 40)
    : existing.currentView;

  const changed =
    nextName !== existing.playerName ||
    nextHero !== existing.heroClass ||
    nextView !== existing.currentView;

  existing.playerName = nextName;
  existing.heroClass = nextHero;
  existing.currentView = nextView;
  existing.lastSeenAt = Date.now();

  if (changed) {
    broadcastPresence();
  }

  return res.json({ ok: true, onlineCount: activeSessions.size });
});

app.post('/api/presence/leave', express.text({ type: '*/*', limit: '4kb' }), (req, res) => {
  let sessionId = '';
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body) as { sessionId?: unknown };
      sessionId = sanitizePresenceField(parsed?.sessionId, '', 80);
    } catch {
      sessionId = '';
    }
  } else if (req.body && typeof req.body === 'object') {
    sessionId = sanitizePresenceField((req.body as { sessionId?: unknown }).sessionId, '', 80);
  }

  if (sessionId && removePresenceSession(sessionId)) {
    broadcastPresence();
  }

  res.status(204).end();
});

/**
 * AI Studio Gemini / Lyria Music Generation Endpoint
 * Uses lyria-3-clip-preview (up to 30s) or lyria-3-pro-preview (full track)
 */
app.post('/api/generate-music', async (req, res) => {
  try {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY environment variable is missing. Please configure it in AI Studio Settings.',
      });
    }

    const {
      prompt = 'Heavy metal battle music with fast distorted electric guitars, crushing drums, and epic power chords for fantasy arena combat.',
      model = 'lyria-3-clip-preview', // 'lyria-3-clip-preview' or 'lyria-3-pro-preview'
      genre = 'heavy metal',
    } = req.body;

    const selectedModel = model === 'lyria-3-pro-preview' ? 'lyria-3-pro-preview' : 'lyria-3-clip-preview';
    const enrichedPrompt = `Genre: Heavy Metal / ${genre}. ${prompt}. Intense electric guitar distortion, driving bassline, heavy drums, high energy soundtrack for an epic fantasy card battle game.`;

    const ai = new GoogleGenAI({ apiKey });

    const responseStream = await ai.models.generateContentStream({
      model: selectedModel,
      contents: enrichedPrompt,
    });

    let audioBase64 = '';
    let lyrics = '';
    let mimeType = 'audio/wav';

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          if (!audioBase64 && part.inlineData.mimeType) {
            mimeType = part.inlineData.mimeType;
          }
          audioBase64 += part.inlineData.data;
        }
        if (part.text && !lyrics) {
          lyrics = part.text;
        }
      }
    }

    if (!audioBase64) {
      return res.status(500).json({
        success: false,
        error: 'No audio data received from music generation model.',
      });
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType,
      lyrics: lyrics || 'Instrumental Heavy Metal Battle Anthem',
      model: selectedModel,
      genre,
    });
  } catch (err: unknown) {
    console.error('Error generating music:', err);
    const message = err instanceof Error ? err.message : 'Unknown error during music generation';
    return res.status(500).json({
      success: false,
      error: message,
    });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
