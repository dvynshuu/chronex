# Chronex 🕒

A production-grade, high-performance web application designed for global teams to navigate time zones, plan synchronized meetings, and manage distributed operations with ease.

## ✨ Key Features

- **Live World Clocks**: Real-time synchronized digital clocks with intelligent DST (Daylight Saving Time) handling.
- **Interactive Time Scrubber**: A fluid, drag-and-drop timeline allowing teams to cross-reference past and future times effortlessly.
- **Smart Meeting Planner**: Automated overlap detection using heatmaps and AI-driven optimal time suggestions.
- **Team Intelligence**: Organization-wide availability dashboards and API usage analytics.
- **Enterprise-Grade Security**: JWT authentication with refresh rotation, granular rate limiting, and encrypted data storage.

## 🚀 Technical Stack

### Frontend
- **Framework**: [React 18](https://reactjs.org/) (Vite-powered)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Time Management**: [Luxon](https://moment.github.io/luxon/)

### Backend
- **Runtime**: [Node.js v18+](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose ODM)
- **Caching**: [Redis](https://redis.io/)
- **Security**: Helmet.js, JWT, Express Rate Limit
- **Testing**: [Vitest](https://vitest.dev/), Supertest

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB & Redis (local or managed)
- Docker & Docker Compose (optional)

### Local Development
1. **Clone & Install**
   ```bash
   # Backend dependencies
   cd server && npm install
   
   # Frontend dependencies
   cd client && npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the `server` directory based on `.env.example`.

3. **Start Development Servers**
   ```bash
   # In /server
   npm run dev
   
   # In /client
   npm run dev
   ```

### Running Tests
```bash
# In /server
npm test
```

### Dockerized Deployment
```bash
# Root directory
docker-compose up --build
```

## 📐 Architecture

Chronex leverages a **Clean Architecture** pattern to ensure scalability and maintainability:
- **Presentation Layer**: React components and hooks for UI logic.
- **API Layer**: Express controllers handling I/O.
- **Business Layer**: Services for complex logic (e.g., time calculations, analytics).
- **Data Layer**: Repositories for database and cache abstraction.

## 🔒 Security & Compliance

- **OWASP Best Practices**: Configured with Helmet.js for secure HTTP headers.
- **Rate Limiting**: Integrated protection against DDoS and automated brute-force attempts.
- **Stateful Auth**: Secure JWT implementation with industry-standard signing.

