# VantagePulse AI™ - Enterprise Competitive Market Intelligence Platform

Benchmarking 1,000+ tech companies and 2,500+ products using Microsoft Azure Cognitive Services (Blob Storage, Text Analytics, Translator API), Node.js REST API Backend, and conversational AI Copilot.

---

## ⚡ Full Backend & Database Architecture

### 1. Node.js REST API Server (`server.js`)
- **Zero-Dependency Architecture**: Built on pure native Node.js (`http`, `fs`, `path`, `url`, `crypto`) — runs out-of-the-box on any machine.
- **Dual-Mode Operation**:
  - Connects to live Azure Cognitive API endpoints or runs the Student Free Plan Smart Simulator (preserving F0 free quotas).
- **REST Endpoints**:
  - `GET /api/health` — System status, dataset counters, Azure operating mode.
  - `GET /api/companies` — Filterable, searchable catalog (supports pagination, category filtering, search queries).
  - `GET /api/companies/:id` — Single company record with full product line.
  - `POST /api/companies` — Ingest new competitor dataset into database + Azure Blob storage container.
  - `GET /api/categories` — 10 industry sector categories with product counts and average sentiment.
  - `GET /api/reviews` — Multilingual customer feedback with sentiment and aspect opinion mining.
  - `POST /api/reviews` — Submit new review with automatic NLP sentiment analysis.
  - `POST /api/azure/sentiment` — Text Analytics sentiment classification and key phrase extraction.
  - `POST /api/azure/translate` — Azure Translator API (English, French, German, Japanese, Spanish, Hindi, Chinese).
  - `GET /api/azure/blobs` — Azure Blob Storage container explorer.
  - `POST /api/auth/login` & `POST /api/auth/logout` — Authentication events persisted to database.
  - `GET /api/auth/logs` — Authentication audit log (Strictly Admin protected).
  - `GET /api/analytics/search-trends` — Trending search telemetry.
  - `POST /api/ai/chat` — Conversational AI intelligence engine.

---

## 📂 Persistent Data Files (`data/`)
- `data/companies.json`: 1,000+ companies across 10 categories with 2,500+ products and radar benchmark scores.
- `data/reviews.json`: Multilingual review transcripts with Azure sentiment and aspect tags.
- `data/auth_logs.json`: Persistent audit trail of all login and logout events.
- `data/search_telemetry.json`: User search queries and trend frequencies.
- `data/blobs/`: Simulated Azure Blob Storage containers (`raw-reviews/`, `translated-transcripts/`, `analytics-output/`, `competitor-specs/`).

---

## 🚀 How to Run the App

### Option A: Run with Full Backend Server
```bash
# Start backend REST API server on http://localhost:3000
node server.js

# Or double click start.bat on Windows
```
Then open `http://localhost:3000` in your browser.

### Option B: Standalone / Static Web Hosting
Open [index.html](index.html) directly in any browser. The client-side `api-client.js` automatically detects standalone mode and seamlessly falls back to client-side IndexedDB with zero downtime.

