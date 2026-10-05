# ShelfLife — Backend API

Node.js, Express.js, and MongoDB REST API for the **ShelfLife Library Management System**.

---

## 1. System Requirements

* **Node.js**: `v18.x` or later (LTS recommended)
* **MongoDB**: `v6.x` or later (Local MongoDB instance or MongoDB Atlas cluster)
* **npm**: `v9.x` or later

---

## 2. Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the environment configuration file:
   ```bash
   cp .env.example .env
   ```

---

## 3. Environment Variables

Configure the following variables in `backend/.env`:

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Network port for Express HTTP server | `5000` |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) | `mongodb://127.0.0.1:27017/shelflife` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | `shelflife_super_secret_jwt_key_2026` |
| `JWT_EXPIRES_IN` | Token lifespan before expiration | `1d` |
| `LIBRARIAN_NAME` | Name for initial seeded librarian | `Demo Librarian` |
| `LIBRARIAN_EMAIL`| Login email address for demo librarian | `admin@shelflife.local` |
| `LIBRARIAN_PASSWORD` | Password for demo librarian | `Admin123!` |

---

## 4. Seeding the Librarian

Before first login, seed the initial demo librarian user into your MongoDB database:

```bash
npm run seed:librarian
```

*This script securely hashes `LIBRARIAN_PASSWORD` using `bcryptjs` (salt rounds: 10) and upserts the librarian document.*

---

## 5. Running the Application

### Development Mode (with hot-reload via nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

*Server default entrypoint:* `http://localhost:5000/api`  
*Health Check:* `GET http://localhost:5000/api/health`

---

## 6. API Endpoints

| Method | Path | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | No | Server health status check |
| `POST` | `/api/auth/login` | No | Authenticate librarian & obtain JWT token |
| `POST` | `/api/books` | **Yes** | Add new book to catalog |
| `GET` | `/api/books` | No | List books (supports `page`, `limit`, `genre`, `search`) |
| `POST` | `/api/members` | **Yes** | Register new library member |
| `GET` | `/api/members` | No | List members (for frontend dropdown selection) |
| `GET` | `/api/members/:memberId/history` | No | Get member borrowing history with dynamic overdue computation |
| `POST` | `/api/borrow` | **Yes** | Atomically issue a book to a member |
| `POST` | `/api/return/:borrowId` | **Yes** | Atomically return a borrowed book & restore availability |

---

## 7. Example Requests (`curl`)

### 1. Librarian Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shelflife.local","password":"Admin123!"}'
```

### 2. Create Book (Authenticated)
```bash
curl -X POST http://localhost:5000/api/books \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "ISBN": "9780132350884",
    "genre": "Technology",
    "totalCopies": 5,
    "availableCopies": 5
  }'
```

### 3. List Books (Pagination, Filter & Search)
```bash
# Paginated list
curl -X GET "http://localhost:5000/api/books?page=1&limit=10"

# Filter by genre
curl -X GET "http://localhost:5000/api/books?genre=Technology"

# Search by title keyword
curl -X GET "http://localhost:5000/api/books?search=clean"
```

### 4. Create Member (Authenticated)
```bash
curl -X POST http://localhost:5000/api/members \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane.doe@campus.edu",
    "membershipId": "MEM-2026-002"
  }'
```

### 5. List Members
```bash
curl -X GET http://localhost:5000/api/members
```

### 6. Issue Book (Authenticated)
```bash
curl -X POST http://localhost:5000/api/borrow \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "<BOOK_MONGO_ID>",
    "memberId": "<MEMBER_MONGO_ID>"
  }'
```

### 7. Return Book (Authenticated)
```bash
curl -X POST http://localhost:5000/api/return/<BORROW_RECORD_MONGO_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 8. Get Member History
```bash
curl -X GET http://localhost:5000/api/members/<MEMBER_MONGO_ID>/history
```

---

## 8. Concurrency & Race-Condition Explanation

> **Exam / Viva Core Answer:**
> ShelfLife protects inventory counts against concurrent race conditions by avoiding the unsafe pattern of reading `availableCopies` in JavaScript, checking availability in memory, and writing back with `save()`. Instead, it leverages MongoDB's native single-document atomic conditional operation `findOneAndUpdate({ _id: bookId, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1 } })`. Because the conditional check and decrement execute atomically within the database engine's write lock, only one concurrent request can ever decrement the last available copy from 1 to 0; any simultaneous contenders fail the `{ $gt: 0 }` filter and return `null`, allowing the API to reliably reject them with an HTTP 409 Conflict without inventory ever dropping below zero. Similarly, returns conditionally transition only unreturned records to prevent double-increment anomalies.

---

## 9. Verification Scripts

The backend includes standalone verification test suites using an in-memory MongoDB server:
* `node scripts/verifyPhase2.js` — Validates Mongoose models & Zod schemas.
* `node scripts/verifyPhase3.js` — Validates authentication & protected routes.
* `node scripts/verifyPhase4.js` — Validates Book & Member endpoints.
* `node scripts/verifyPhase5.js` — Validates Borrow, Return, and History flows.
* `node scripts/verifyConcurrency.js` — Validates the last-copy race-condition under 10 simultaneous borrow requests and double-return protection.
