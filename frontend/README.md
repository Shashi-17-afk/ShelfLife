# ShelfLife — Frontend Web Application

A clean, responsive single-page web application built with **React 18**, **TypeScript**, and **Vite** for the **ShelfLife Library Management System**.

---

## 1. Technologies & Architecture

* **Framework**: React 18 (Functional components, Hooks)
* **Build Tool**: Vite 5
* **Language**: TypeScript 5 (Strict type checking enabled)
* **Routing**: React Router DOM v6 (Nested layouts, protected routes, dynamic parameters)
* **HTTP Client**: Axios with typed request/response interceptors
* **Toast Notifications**: React Hot Toast
* **Icons**: Lucide React
* **Styling**: Vanilla CSS Design System with CSS Tokens & Scoped CSS Modules (No heavy CSS framework dependencies)

---

## 2. Directory Structure

```text
frontend/
├── src/
│   ├── api/                # Typed API client & resource endpoints
│   │   ├── client.ts       # Axios instance with JWT interceptor & 401 handler
│   │   ├── books.ts        # getBooks (paginated, search, filter), createBook
│   │   ├── members.ts      # getMembers, createMember, getMemberHistory
│   │   └── borrow.ts       # issueBook, returnBook
│   ├── components/         # Reusable presentation components
│   │   ├── DataTable.tsx   # Generic TypeScript component (DataTable<T>)
│   │   ├── DataTable.module.css
│   │   └── ProtectedRoute.tsx # Route authentication guard
│   ├── context/
│   │   └── AuthContext.tsx # Global authentication context & token persistence
│   ├── layouts/
│   │   ├── MainLayout.tsx  # Authenticated shell (Header, Nav, User Badge, Logout)
│   │   └── MainLayout.module.css
│   ├── pages/              # Routed application views
│   │   ├── LoginPage.tsx   # Librarian authentication portal
│   │   ├── BooksPage.tsx   # Catalog table, debounced search, genre filter, modal
│   │   ├── IssuePage.tsx   # Member/Book selectors, stock check, 14-day policy
│   │   └── MemberHistoryPage.tsx # Loans table, dynamic overdue badges, returns
│   ├── types/
│   │   └── index.ts        # Domain models (Book, Member, BorrowRecord, Librarian)
│   ├── App.tsx             # Route declarations & global toast provider
│   ├── index.css           # Design tokens, CSS variables, and base resets
│   ├── main.tsx            # Application entrypoint
│   └── vite-env.d.ts       # Vite client types & CSS module declarations
├── .env.example            # Environment configuration template
├── index.html              # HTML5 entry with Google Font 'Plus Jakarta Sans'
├── package.json
├── tsconfig.json           # Application TypeScript compiler options
└── vite.config.ts          # Vite bundler configuration
```

---

## 3. Installation & Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Ensure `VITE_API_BASE_URL` points to your active backend:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

---

## 4. Running the Application

### Development Server
```bash
npm run dev
```
*Access the application at:* **`http://localhost:5173`**

### Production Build & Type Check
```bash
npm run build
```
*Compiles TypeScript and bundles production assets into `dist/` with zero errors.*

### Preview Production Build
```bash
npm run preview
```

---

## 5. Key Architecture Decisions

### 1. State Management (Why Context over Redux)
* **AuthContext**: Authentication credentials (`token` and `librarian`) are needed globally across protected routes and HTTP headers. React Context provides a lightweight, dependency-free solution without the boilerplate of Redux.
* **Component-Level State**: Books, filtering parameters, and issue form state live inside their respective page components (`useState`, `useCallback`, `useMemo`), preventing unnecessary global re-renders and keeping components self-contained.

### 2. Generic TypeScript Component (`DataTable<T>`)
* Section 19 requirement is satisfied with `DataTable<T>`.
* It accepts strongly-typed column configurations with custom JSX render functions:
  ```typescript
  interface Column<T> {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }
  ```
* Reused across both the **Book Catalogue** (`DataTable<Book>`) and **Member History** (`DataTable<BorrowRecord>`).

### 3. Client-Side Concurrency & UX Safety
* **In-Flight Mutation Disabling**: The "Issue Book" and "Return Book" buttons immediately enter a disabled loading state (`isSubmitting`) when clicked, preventing accidental double submissions.
* **401 Interceptor**: If a JWT expires, Axios catches the 401 response, clears `localStorage`, and triggers an immediate redirect to `/login`.
