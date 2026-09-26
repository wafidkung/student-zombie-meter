import { Database } from "bun:sqlite";
import { join, resolve } from "path";
import { existsSync, statSync } from "fs";

// ======================================================================
// 🚀 STUDENT ZOMBIE METER - BUN SQL SERVER & API GATEWAY
// Author: Student ID 6710210312
// Engine: Bun 1.3.8 + bun:sqlite (Zero Docker, High Performance SQL)
// ======================================================================

const PORT = Number(process.env.PORT) || 3000;
const PYTHON_API_URL = process.env.PYTHON_API_URL || "http://127.0.0.1:7860";
const PROJECT_ROOT = resolve(__dirname, "..");
const DB_PATH = join(PROJECT_ROOT, "data", "fatigue_history.db");
const DIST_PATH = join(PROJECT_ROOT, "frontend", "dist");

console.log("======================================================================");
console.log("   🧟 STUDENT ZOMBIE METER - BUN SQLITE & GATEWAY SERVER");
console.log("   Student ID: 6710210312 | Project: Fatigue Detection System");
console.log("======================================================================");
console.log(`📁 Database Path: ${DB_PATH}`);
console.log(`🔗 Python ML Target: ${PYTHON_API_URL}`);

// Initialize SQLite database
const db = new Database(DB_PATH, { create: true });
db.run("PRAGMA journal_mode = WAL;");
db.run("PRAGMA synchronous = NORMAL;");

// Create fatigue_logs table with indexes
db.run(`
  CREATE TABLE IF NOT EXISTS fatigue_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    session_id TEXT NOT NULL,
    eye_openness REAL,
    eye_aspect_ratio REAL NOT NULL,
    mouth_aspect_ratio REAL NOT NULL,
    under_eye_darkness_ratio REAL NOT NULL,
    skin_texture_var REAL,
    lighting_condition TEXT DEFAULT 'Well-Lit',
    time_slot TEXT NOT NULL,
    fatigue_score REAL NOT NULL,
    fatigue_level TEXT NOT NULL,
    ground_truth_feedback TEXT,
    user_notes TEXT
  );
`);

db.run(`CREATE INDEX IF NOT EXISTS idx_fatigue_logs_created_at ON fatigue_logs(created_at DESC);`);
db.run(`CREATE INDEX IF NOT EXISTS idx_fatigue_logs_time_slot ON fatigue_logs(time_slot);`);
db.run(`CREATE INDEX IF NOT EXISTS idx_fatigue_logs_level ON fatigue_logs(fatigue_level);`);

// Check if seed data is needed
const countRow = db.query(`SELECT COUNT(*) as count FROM fatigue_logs`).get() as { count: number };
if (countRow.count === 0) {
  console.log("🌱 Database is empty. Seeding initial Circadian progression records...");
  const insertSeed = db.prepare(`
    INSERT INTO fatigue_logs (
      session_id, eye_openness, eye_aspect_ratio, mouth_aspect_ratio,
      under_eye_darkness_ratio, skin_texture_var, lighting_condition,
      time_slot, fatigue_score, fatigue_level, ground_truth_feedback, user_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime', ?))
  `);

  const seeds = [
    ["seed-1", 0.78, 0.35, 0.18, 0.95, 0.65, "Well-Lit", "Daytime", 15.5, "Alert", "Accurate", "Session start (สดชื่น)", "-6 hours"],
    ["seed-2", 0.72, 0.33, 0.20, 0.92, 0.60, "Well-Lit", "Daytime", 24.0, "Alert", "Accurate", "Reading session 1", "-5 hours"],
    ["seed-3", 0.52, 0.25, 0.30, 0.82, 0.48, "Fluorescent", "Evening", 48.5, "Tired", "Accurate", "After class (เริ่มล้า)", "-3 hours"],
    ["seed-4", 0.45, 0.21, 0.38, 0.75, 0.42, "Dim-Light", "Evening", 62.0, "Tired", "Accurate", "Homework session", "-2 hours"],
    ["seed-5", 0.22, 0.14, 0.48, 0.65, 0.31, "Dim-Light", "Overnight", 88.5, "Zombie", "Accurate", "Late night review", "-1 hours"],
    ["seed-6", 0.18, 0.12, 0.55, 0.60, 0.28, "Dim-Light", "Overnight", 94.0, "Zombie", "Accurate", "Cramming exam (วิกฤต)", "0 hours"]
  ];

  for (const s of seeds) {
    insertSeed.run(...s);
  }
  console.log(`✅ Seeded ${seeds.length} records into SQLite database successfully!`);
} else {
  console.log(`📊 Found ${countRow.count} existing records in SQLite database.`);
}

// Prepared Statements for SQL execution
const selectRecentLogsStmt = db.prepare(`
  SELECT * FROM fatigue_logs ORDER BY created_at DESC LIMIT ?
`);

const insertLogStmt = db.prepare(`
  INSERT INTO fatigue_logs (
    session_id, eye_openness, eye_aspect_ratio, mouth_aspect_ratio,
    under_eye_darkness_ratio, skin_texture_var, lighting_condition,
    time_slot, fatigue_score, fatigue_level, ground_truth_feedback, user_notes, created_at
  ) VALUES (
    $session_id, $eye_openness, $eye_aspect_ratio, $mouth_aspect_ratio,
    $under_eye_darkness_ratio, $skin_texture_var, $lighting_condition,
    $time_slot, $fatigue_score, $fatigue_level, $ground_truth_feedback, $user_notes, datetime('now', 'localtime')
  )
  RETURNING *;
`);

const updateFeedbackStmt = db.prepare(`
  UPDATE fatigue_logs
  SET ground_truth_feedback = $feedback,
      user_notes = COALESCE($user_notes, user_notes)
  WHERE id = $id
  RETURNING *;
`);

// CORS Headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
  });
}

// MIME Type helper for static files
const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

// Bun HTTP Server
const server = Bun.serve({
  port: PORT,
  hostname: "0.0.0.0",

  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 1. Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. Health & Status Check
    if (pathname === "/api/health") {
      let pythonOnline = false;
      try {
        const pyHealth = await fetch(`${PYTHON_API_URL}/health`, { signal: AbortSignal.timeout(1500) });
        pythonOnline = pyHealth.ok;
      } catch {
        pythonOnline = false;
      }

      const totalRows = (db.query("SELECT COUNT(*) as count FROM fatigue_logs").get() as { count: number }).count;
      return jsonResponse({
        status: "healthy",
        server: "Bun Native Server (Student Zombie Meter)",
        student_id: "6710210312",
        database: "SQLite (bun:sqlite)",
        db_file: DB_PATH,
        total_records: totalRows,
        python_ml_backend: {
          url: PYTHON_API_URL,
          status: pythonOnline ? "connected (Port 7860)" : "offline (run run_app_bun.bat to start)"
        },
        uptime_seconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString()
      });
    }

    // 3. SQL Data API: Get Recent Logs
    if (pathname === "/api/v1/logs" && req.method === "GET") {
      const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
      try {
        const rows = selectRecentLogsStmt.all(limit);
        return jsonResponse(rows);
      } catch (err: any) {
        return jsonResponse({ error: "Failed to fetch logs from SQLite", detail: err.message }, 500);
      }
    }

    // 4. SQL Data API: Insert New Log
    if (pathname === "/api/v1/logs" && req.method === "POST") {
      try {
        const body = await req.json();
        const inserted = insertLogStmt.get({
          $session_id: body.session_id || `sess-${Date.now()}`,
          $eye_openness: body.eye_openness ?? 0.5,
          $eye_aspect_ratio: body.eye_aspect_ratio ?? 0.25,
          $mouth_aspect_ratio: body.mouth_aspect_ratio ?? 0.25,
          $under_eye_darkness_ratio: body.under_eye_darkness_ratio ?? 0.8,
          $skin_texture_var: body.skin_texture_var ?? 0.5,
          $lighting_condition: body.lighting_condition || "Well-Lit",
          $time_slot: body.time_slot || "Daytime",
          $fatigue_score: Number(body.fatigue_score) || 0.0,
          $fatigue_level: body.fatigue_level || "Alert",
          $ground_truth_feedback: body.ground_truth_feedback || null,
          $user_notes: body.user_notes || null,
        });
        return jsonResponse(inserted, 201);
      } catch (err: any) {
        return jsonResponse({ error: "Failed to insert into SQLite", detail: err.message }, 400);
      }
    }

    // 5. SQL Data API: Update Feedback for Active Learning
    const feedbackMatch = pathname.match(/^\/api\/v1\/logs\/(\d+)\/feedback$/);
    if (feedbackMatch && (req.method === "PUT" || req.method === "POST")) {
      const logId = Number(feedbackMatch[1]);
      try {
        const body = await req.json();
        const updated = updateFeedbackStmt.get({
          $id: logId,
          $feedback: body.ground_truth_feedback || body.feedback || "Accurate",
          $user_notes: body.user_notes || null,
        });
        if (!updated) {
          return jsonResponse({ error: "Record not found", id: logId }, 404);
        }
        return jsonResponse({ status: "success", record: updated });
      } catch (err: any) {
        return jsonResponse({ error: "Failed to update feedback", detail: err.message }, 400);
      }
    }

    // 6. SQL Aggregate Analytics Endpoint (Circadian & ML Model Metrics)
    if (pathname === "/api/v1/stats" && req.method === "GET") {
      try {
        const slotStats = db.query(`
          SELECT 
            time_slot,
            COUNT(*) as total_samples,
            ROUND(AVG(fatigue_score), 2) as avg_fatigue_score,
            ROUND(AVG(eye_aspect_ratio), 3) as avg_ear,
            ROUND(AVG(mouth_aspect_ratio), 3) as avg_mar
          FROM fatigue_logs
          GROUP BY time_slot
        `).all();

        const levelStats = db.query(`
          SELECT 
            fatigue_level,
            COUNT(*) as count,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM fatigue_logs), 1) as percentage
          FROM fatigue_logs
          GROUP BY fatigue_level
        `).all();

        const feedbackStats = db.query(`
          SELECT 
            ground_truth_feedback,
            COUNT(*) as count
          FROM fatigue_logs
          WHERE ground_truth_feedback IS NOT NULL
          GROUP BY ground_truth_feedback
        `).all();

        const totalRecords = (db.query("SELECT COUNT(*) as count FROM fatigue_logs").get() as { count: number }).count;

        return jsonResponse({
          total_records: totalRecords,
          by_time_slot: slotStats,
          by_level: levelStats,
          ground_truth_feedback: feedbackStats,
        });
      } catch (err: any) {
        return jsonResponse({ error: "Failed to query stats", detail: err.message }, 500);
      }
    }

    // 7. Proxy ML Inference Endpoints to Python FastAPI
    if (
      pathname.startsWith("/api/v1/predict") ||
      pathname.startsWith("/api/v2/predict_temporal")
    ) {
      const targetUrl = `${PYTHON_API_URL}${pathname}${url.search}`;
      try {
        const headers = new Headers(req.headers);
        headers.delete("host");

        const proxyRes = await fetch(targetUrl, {
          method: req.method,
          headers: headers,
          body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
        });

        const resHeaders = new Headers(proxyRes.headers);
        for (const [k, v] of Object.entries(corsHeaders)) {
          resHeaders.set(k, v);
        }

        return new Response(proxyRes.body, {
          status: proxyRes.status,
          headers: resHeaders,
        });
      } catch (err: any) {
        return jsonResponse({
          status: "error",
          error: "Python ML Inference Engine offline",
          message: "Could not reach FastAPI on port 7860. Run run_app_bun.bat to launch both Python & Bun.",
          target: targetUrl,
          detail: err.message
        }, 502);
      }
    }

    // 8. Static File Serving (Built Frontend) or Gateway Status Page
    if (existsSync(DIST_PATH)) {
      // Strip leading slash
      const relativePath = pathname.slice(1);
      const filePath = join(DIST_PATH, relativePath);

      if (relativePath && existsSync(filePath) && statSync(filePath).isFile()) {
        const ext = relativePath.slice(relativePath.lastIndexOf(".")).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const file = Bun.file(filePath);
        return new Response(file, {
          headers: { "Content-Type": contentType, ...corsHeaders },
        });
      }

      // SPA fallback to index.html
      const indexPath = join(DIST_PATH, "index.html");
      if (existsSync(indexPath)) {
        return new Response(Bun.file(indexPath), {
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
        });
      }
    }

    // 9. Root Landing Page (if dist not yet built)
    if (pathname === "/" || pathname === "/index.html") {
      const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Zombie Meter - Bun SQL Gateway</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
    <div class="flex items-center space-x-3">
      <span class="text-4xl">🧟</span>
      <div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Student Zombie Meter Server
        </h1>
        <p class="text-xs text-slate-400">Bun Native SQL Server & API Gateway (Port 3000)</p>
      </div>
    </div>
    
    <div class="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-sm space-y-2">
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Database Engine:</span>
        <span class="font-mono text-emerald-400 font-semibold">SQLite 3 (bun:sqlite)</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Database File:</span>
        <span class="font-mono text-slate-200 text-xs">data/fatigue_history.db</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-slate-400">Vite React Dev Server:</span>
        <a href="https://localhost:5173" target="_blank" class="text-cyan-400 hover:underline">https://localhost:5173 ↗</a>
      </div>
    </div>

    <div class="space-y-2">
      <p class="text-xs text-slate-400 font-medium">Available API Endpoints:</p>
      <div class="grid grid-cols-1 gap-2 text-xs font-mono">
        <a href="/api/health" class="p-2 bg-slate-800/60 rounded hover:bg-slate-800 text-emerald-300">GET /api/health (Server & DB Status)</a>
        <a href="/api/v1/logs" class="p-2 bg-slate-800/60 rounded hover:bg-slate-800 text-cyan-300">GET /api/v1/logs (Recent SQL Fatigue Logs)</a>
        <a href="/api/v1/stats" class="p-2 bg-slate-800/60 rounded hover:bg-slate-800 text-purple-300">GET /api/v1/stats (SQL Circadian Aggregations)</a>
      </div>
    </div>
  </div>
</body>
</html>`;
      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders },
      });
    }

    return jsonResponse({ error: "Endpoint not found", path: pathname }, 404);
  },
});

console.log(`🚀 Bun Server running at: http://localhost:${PORT}`);
console.log(`🌐 LAN Network URL: http://0.0.0.0:${PORT}`);
console.log(`📊 SQL Ready: Connected to ${DB_PATH} via bun:sqlite`);
