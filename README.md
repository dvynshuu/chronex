# TIME.IQ | Global Time Intelligence Platform

A production-grade web application for global teams to navigate time zones, plan meetings, and manage remote operations.

## ✨ Features
- **Live World Clocks**: Synchronized digital clocks with DST handling.
- **Interactive Scrubber**: Drag-and-drop timeline to compare future times.
- **Smart Meeting Planner**: Overlap detection with AI-driven optimal time suggestions.
- **Team Dashboard**: Organization-wide availability and usage analytics.
- **Enterprise Security**: JWT auth, rate limiting, and encrypted storage.

## 🚀 Tech Stack
- **Frontend**: React (Vite), Framer Motion, Recharts, Bootstrap.
- **Backend**: Node.js, Express, MongoDB, Redis.
- **DevOps**: Docker, Winston Logger.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v18+
- Docker & Docker Compose (optional but recommended)
- MongoDB & Redis instances

### Standard Setup
1. **Clone & Install**
   ```bash
   # Backend
   cd server && npm install
   
   # Frontend
   cd client && npm install
   ```

2. **Environment Configuration**
   Create a `.env` in the `server` folder (see `.env.example`).

3. **Run Development Mode**
   ```bash
   # Backend
   npm run dev
   
   # Frontend
   npm run dev
   ```

### Docker Setup
```bash
docker-compose up --build
```

## 📐 Architecture
The project follows a **Clean Architecture** pattern:
- **Controllers**: Handle HTTP requests.
- **Services**: Contain business logic (Time calculations, Analytics).
- **Repositories**: Abstract data access.
- **Models**: Mongoose schema definitions.

## 🔒 Security
- **OWASP Compliance**: Helmet.js for secure headers.
- **Rate Limiting**: Protection against DDoS/Brute-force.
- **JWT**: Stateless authentication with refresh tokens.

---
Built with ❤️ by Antigravity
