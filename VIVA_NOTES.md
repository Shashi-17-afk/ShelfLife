# ShelfLife — Technical Viva & Defense Notes

A concise, high-yield preparation guide explaining the architectural and engineering decisions implemented in the **ShelfLife** project.

---

### 1. Why MongoDB & Mongoose?
* **Document Model**: Library catalogs naturally contain semi-structured documents with varied attributes (authors, genres, edition details). MongoDB allows flexible document storage with native BSON IDs and JSON interchange.
* **Mongoose ODM**: Provides schema definitions, type casting, default values (`joinedDate: Date.now`), pre/post hooks, and database-level validation (e.g., unique indexes on `ISBN`, `email`, and `membershipId`).

### 2. Schema References (`ObjectId` and `ref`)
* In `BorrowRecord`, we store `book: { type: ObjectId, ref: 'Book' }` and `member: { type: ObjectId, ref: 'Member' }`.
* **Why not embed?** Embedding the whole book or member inside every borrow record causes data duplication and stale data when a member changes their email or a book title is updated. Storing references enables fast normal form queries and populating via Mongoose `.populate()`.

### 3. JWT Authentication & Password Hashing
* **Password Security**: Passwords are never stored in plaintext. `bcryptjs` hashes passwords with 10 salt rounds using a slow key-derivation function that resists brute-force and rainbow table attacks.
* **Stateless Tokens**: On login (`POST /api/auth/login`), the server issues a signed JSON Web Token containing `{ id, email, role }`. The backend does not need session tables in a database—each request validates the cryptographic signature with `JWT_SECRET`.

### 4. Express Middleware Architecture
* Middleware functions execute sequentially in the HTTP pipeline: `(req, res, next) => {}`.
* In ShelfLife:
  1. `cors()` & `express.json()` parse headers and request body.
  2. `requestLogger` logs method, path, status, and execution duration.
  3. `requireAuth` validates the `Bearer <token>` header and attaches `req.user`.
  4. `validate(schema)` runs Zod schemas against `req.body`, `req.query`, and `req.params`.
  5. `errorHandler` catches operational and database errors centrally, ensuring uniform error formats.

### 5. Zod Validation vs. Mongoose Validation
* **Layered Defense**:
  * **Zod** runs at the HTTP ingress layer *before* any database query is touched. It returns immediate, friendly validation errors (`400 Bad Request`) for malformed fields, regex mismatches, and out-of-range numbers.
  * **Mongoose** validates at the persistence layer (e.g. database-enforced unique constraints, casting).

### 6. REST API Design Principles
* Stateless requests, standard HTTP verbs (`GET`, `POST`), and semantic HTTP status codes:
  * `200 OK`: Successful read or update.
  * `201 Created`: Successful resource creation.
  * `400 Bad Request`: Validation failure.
  * `401 Unauthorized`: Missing or invalid JWT token.
  * `404 Not Found`: Resource does not exist.
  * `409 Conflict`: Business rule collision (duplicate unique key, book out of stock, already returned).
  * `500 Internal Server Error`: Unexpected server malfunction.

### 7. React State, Hooks, & Component Lifecycle
* **`useState`**: Stores local UI state (search inputs, active tab, modal visibility).
* **`useEffect`**: Triggers side effects (fetching data on mount or when debounced filter parameters change).
* **`useMemo`**: Memoizes computed properties (derived borrow stats, table column configurations) to avoid expensive recalculations on every render.
* **`useCallback`**: Memoizes handler functions across re-renders to prevent unnecessary child re-renders.

### 8. React Context API vs. Redux
* For ShelfLife, **React Context** (`AuthContext`) is ideal because only global authentication tokens and user profiles need to be shared across disparate routes. Page data (e.g. books table, issue form) lives in component state.
* Introducing Redux would add excessive boilerplate (actions, reducers, dispatchers) without any performance benefit at this application scale.

### 9. TypeScript Generics (`DataTable<T>`)
* Generic components use a type parameter `<T>` that allows a component to operate over a variety of data structures while preserving compile-time type safety.
* Our `DataTable<T>` accepts `columns: Column<T>[]` and `data: T[]`. Whether passed `Book` or `BorrowRecord`, TypeScript automatically checks property access inside custom cell renderers without resorting to `any`.

### 10. Client-Side Route Protection (`<ProtectedRoute />`)
* React Router does not natively prevent URL navigation.
* `<ProtectedRoute />` wraps authenticated layouts. It inspects `isAuthenticated` from `AuthContext`:
  * If true: renders child components (`<MainLayout />` with `<Outlet />`).
  * If false: redirects to `/login`, preserving the requested URL location in state for seamless post-login redirection.

### 11. Atomic MongoDB Conditional Updates (Concurrency Protection)
* **The Problem**: A naive check in JavaScript:
  ```javascript
  const book = await Book.findById(id);
  if (book.availableCopies > 0) {
    book.availableCopies--;
    await book.save();
  }
  ```
  causes race conditions when two concurrent requests read `availableCopies = 1` simultaneously, creating two loans for the last remaining copy.
* **The Solution**: Single-document atomic conditional mutation:
  ```javascript
  const book = await Book.findOneAndUpdate(
    { _id: bookId, availableCopies: { $gt: 0 } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );
  ```
  MongoDB executes the condition match and decrement within a single atomic write lock. Only one concurrent request can successfully decrement the last copy; any simultaneous requests fail the filter and return `null`, allowing ShelfLife to return `409 Conflict`.

### 12. Multi-Document Transactions vs. Atomic Mutations
* Atomic updates protect single-document invariants without infrastructure overhead.
* Multi-document transactions (`session.startTransaction()`) group multiple document changes (e.g., creating `BorrowRecord` and decrementing `Book`) under ACID guarantees. In ShelfLife, we use atomic conditional updates with compensating rollback actions, making it fully functional on standalone MongoDB instances while ready for replica-set transactions.

### 13. Caching & Invalidation (Redis)
* **Read-heavy**: Catalog queries (`GET /api/books`) account for ~80% of traffic.
* Cached in Redis with structured keys: `books:{libraryId}:{genre}:{search}:{page}`.
* Short TTLs (30–60 seconds) ensure automatic inventory convergence, supplemented by key evictions on book creation.

### 14. Database Sharding & Shard Keys
* Sharding horizontally partitions database collections across independent nodes.
* Partitioning key: `libraryId` ensures data locality so campus-level queries route to a single shard rather than broadcasting across 500 servers.
* Compound shard key `{ libraryId: 1, _id: "hashed" }` prevents write hotspots when new book shipments are cataloged.

### 15. Horizontal Auto-Scaling & Load Balancing
* API servers are stateless; any server can fulfill any request because session state lives in JWTs.
* An Application Load Balancer distributes requests across container pods. During peak semester rushes, Kubernetes HPA spins up additional pods based on CPU/latency metrics, scaling back down post-rush to minimize annual cloud costs.
