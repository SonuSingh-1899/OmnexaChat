# Omnexa Chat

Omnexa Chat is a full-stack real-time chat application built with a React + Vite frontend and a Spring Boot backend. It supports secure authentication, private messaging over WebSockets, follow-based chat access, profile management, push notifications, and a mobile-friendly PWA experience.

## Overview

The project is split into two apps:

- `Frontend/`: React 19, Vite, Tailwind CSS, SockJS/STOMP, Firebase web messaging, and PWA support
- `backend/`: Spring Boot 3, Spring Security, WebSocket/STOMP, PostgreSQL, Redis, JWT, and Firebase Admin

The frontend is designed for deployment on Vercel, while the backend includes Docker and Render configuration for production hosting.

## Features

- Email OTP-based sign-up and account verification
- JWT-based authentication and protected APIs
- Real-time private chat using WebSocket + STOMP
- Follow request flow before users can start chatting
- Message replies, editing, and deletion
- Real-time typing indicator
- Read receipts and unread message counters
- Profile editing with avatar upload
- Push notifications via Firebase Cloud Messaging
- Mobile-friendly responsive UI
- PWA install support

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Axios
- SockJS + STOMP
- Firebase Web SDK
- `vite-plugin-pwa`

### Backend

- Java 17
- Spring Boot 3.3
- Spring Security
- Spring Data JPA
- Spring WebSocket
- PostgreSQL
- Redis
- JWT (`jjwt`)
- Firebase Admin SDK

## Repository Structure

```text
.
|-- Frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- lib/
|   |   |-- pages/
|   |   |-- routes/
|   |   `-- theme/
|   |-- package.json
|   `-- vite.config.js
|
|-- backend/
|   |-- src/main/java/com/example/chat/
|   |   |-- controller/
|   |   |-- service/
|   |   |-- repository/
|   |   |-- entity/
|   |   |-- DTO/
|   |   `-- config/
|   |-- src/main/resources/
|   |-- pom.xml
|   |-- Dockerfile
|   `-- render.yaml
|
`-- uploads/
```

## Local Development

### Prerequisites

- Node.js 18+
- npm
- Java 17
- Maven wrapper (`mvnw` / `mvnw.cmd` is included)
- PostgreSQL
- Redis

### 1. Clone the repository

```bash
git clone https://github.com/SonuSingh-1899/OmnexaChat.git
cd Chat-in-public
```

### 2. Start the backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs on `http://localhost:8080`.

### 3. Start the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

## Frontend Environment Variables

Create a `.env` file inside `Frontend/` if you want to override local or deployed values.

Required:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_SOCKET_BASE_URL=http://localhost:8080
```

Optional Firebase web config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_FIREBASE_VAPID_KEY=
```

## Backend Environment Variables

The backend reads most values from environment variables, especially in production.

```env
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080

JWT_SECRET=
JWT_EXPIRATION=86400000

DB_URL=
DB_USERNAME=
DB_PASSWORD=
JPA_DDL_AUTO=update
JPA_SHOW_SQL=false

REDIS_URL=

APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
APP_WEB_BASE_URL=http://localhost:5173
APP_UPLOAD_DIR=uploads

BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

FIREBASE_ENABLED=true
FIREBASE_SERVICE_ACCOUNT_PATH=
CHAT_MESSAGE_RETENTION_DAYS=3
```

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
./mvnw spring-boot:run
./mvnw test
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
```

## Deployment Notes

### Frontend

- `Frontend/vercel.json` rewrites all routes to `/` for SPA navigation
- `Frontend/vite.config.js` configures PWA manifest generation
- Recommended host: Vercel

### Backend

- `backend/Dockerfile` is included
- `backend/render.yaml` contains a basic Render service definition
- Recommended host: Render or any Docker-friendly Java host

## API and Realtime Notes

- REST APIs are used for authentication, profile updates, message CRUD, unread counts, and relationship actions
- WebSockets are used for real-time message delivery, typing state, and read/update events
- Users can only chat after a connection or follow request has been accepted

## Storage Notes

- Avatar uploads are currently served from the backend via `/uploads/**`
- In production, using persistent object storage is strongly recommended if your server filesystem is ephemeral

## PWA Notes

- The frontend includes installable PWA support through `vite-plugin-pwa`
- Firebase Cloud Messaging is used for browser and device notifications where supported

## Future Improvements

- Message pagination and chat history optimization
- Persistent cloud storage for avatars
- Better moderation or admin tooling
- Automated test coverage for chat and WebSocket flows
- Group chat support

## License

No license file is currently included in this repository. Add one if you plan to open-source or distribute the project publicly.
