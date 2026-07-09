# Takt - Time & Productivity Tracking Platform

> **Takt is a time and productivity tracking platform that helps professionals**
> **and students understand how they are distributing their time throughout the**
> **day. Through customizable categories, calendar activity logging, and**
> **productivity assessments, users transform everyday data into insights to**
> **improve focus, organization, and performance.**

## 🎯 Overview

Takt empowers users to take control of their time with intuitive tools to
track, categorize, and analyze daily activities. Whether you are a
professional juggling multiple projects or a student managing study sessions,
Takt helps you:

- **Track time** in real-time or log activities manually
- **Categorize activities** with predefined or custom categories
- **Evaluate productivity** on a 4-level scale (None, Low, Productive, Highly Productive)
- **Visualize patterns** through calendar and timeline views
- **Generate insights** to optimize your workflow and productivity

---

## 🛠️ Tech Stack

### **Frontend**

- **React** 18.2 - Modern UI library
- **Vite** 5.0 - Ultra-fast build tool and dev server
- **TypeScript** 5.2 - Type-safe JavaScript
- **Lucide React** - Beautiful, consistent icons

### **Backend**

- **Express.js** 4.18 - Lightweight API framework
- **Node.js** ≥18 - JavaScript runtime
- **TypeScript** 5.2 - Type-safe backend

### **Shared**

- **React Components Library** - Design system package with reusable UI components
- **CSS Theme** - Centralized styling and theme management

### **Testing**

- **Vitest** 1.2 - Fast unit test framework
- **Testing Library** - React component testing utilities
- **Supertest** 6.3 - HTTP assertion library

### **Package Management**

- **pnpm** 9.15+ - Fast, disk-space efficient package manager
- **Monorepo** - Workspace setup for scalable multi-package development

---

## 📁 Project Structure

```text
takt-app/
├── packages/
│   ├── bff/                      # Backend-for-Frontend API
│   │   ├── src/
│   │   │   ├── server.ts         # Express app setup
│   │   │   ├── index.ts          # Entry point
│   │   │   └── routes/           # API endpoints
│   │   │       ├── auth.ts       # Authentication
│   │   │       ├── activities.ts # Activity management
│   │   │       └── categories.ts # Category management
│   │   ├── __tests__/            # Integration tests
│   │   └── vitest.config.ts      # Test configuration
│   │
│   ├── design-system/            # Shared UI Components
│   │   ├── src/
│   │   │   ├── components/       # Reusable React components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── ProductivityBadge.tsx
│   │   │   ├── theme.css         # Global styles
│   │   │   └── index.ts          # Public exports
│   │   ├── __tests__/            # Component tests
│   │   └── vitest.config.ts      # Test configuration
│   │
│   └── frontend/                 # React SPA
│       ├── src/
│       │   ├── App.tsx           # Main application component
│       │   ├── main.tsx          # React DOM render entry
│       │   ├── components/       # UI components
│       │   │   ├── CalendarView.tsx   # Schedule visualization
│       │   │   └── StopwatchPanel.tsx # Real-time timer
│       │   ├── services/         # API integration
│       │   │   └── api.ts        # Centralized API client
│       │   ├── setupTests.ts     # Test utilities
│       │   └── App.test.tsx      # Integration tests
│       ├── index.html            # HTML entry point
│       ├── vitest.config.ts      # Test configuration
│       └── tsconfig.json         # TypeScript configuration
│
├── tsconfig.base.json            # Base TypeScript configuration
├── pnpm-workspace.yaml           # Workspace configuration
└── package.json                  # Root workspace package

```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥18.x
- **pnpm** ≥9.15.x (install globally: `npm install -g pnpm`)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd takt-app
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development servers**

   ```bash
   # In one terminal - Backend API
   pnpm dev:bff

   # In another terminal - Frontend
   pnpm dev:frontend
   ```

4. **Access the application**
   - Frontend: <http://localhost:5173>
   - Backend API: <http://localhost:3000>

### Quick Test

Log in with any email and a password with 4+ characters:

- **Email**: <any@email.com>
- **Password**: anypassword123

---

## 📝 Available Scripts

### **Root Commands** (run from project root)

| Command | Description |
| --------- | ------------- |
| `pnpm dev:frontend` | Start React dev server with hot reload |
| `pnpm dev:bff` | Start Express API server with live reloading |
| `pnpm build` | Build all packages (TypeScript + Vite bundling) |
| `pnpm test` | Run all tests across all packages |
| `pnpm test --watch` | Run tests in watch mode |

### **Package-Specific Commands**

```bash
# Backend testing
pnpm --filter bff test

# Design system testing
pnpm --filter design-system test

# Frontend testing
pnpm --filter frontend test
```

---

## 🔌 API Reference

### **Base URL**

```text
http://localhost:3000/api
```

### **Health Check**

```text
GET /health
```

### **Authentication**

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):

```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-123",
    "name": "João Silva",
    "role": "professional",
    "level": 1,
    "weeklyTargetHours": 40
  }
}
```

---

### **Key Design Patterns**

- **Monorepo**: Multiple packages managed with pnpm workspaces
- **Separation of Concerns**: Frontend, API, and UI library are decoupled
- **Component Composition**: Reusable components from design-system
- **Type Safety**: Strict TypeScript across all layers
- **API Client Layer**: Centralized HTTP handling with authentication

---

## ✅ Testing

### **Test Suite Overview**

| Package | Coverage | Files |
| --------- | ---------- | ------- |
| **bff** | API routes, handlers | `packages/bff/__tests__/routes.test.ts` |
| **design-system** | React components | `packages/design-system/src/components/__tests__/components.test.tsx` |
| **frontend** | Integration tests and UI flows | `packages/frontend/src/App.test.tsx` |

### **Running Tests**

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run specific package tests
pnpm --filter frontend test
pnpm --filter bff test
pnpm --filter design-system test
```

### **Test Tools**

- **Vitest** - Ultra-fast test runner with instant feedback
- **@testing-library/react** - User-centric component testing
- **Supertest** - HTTP assertion and mocking for API tests
- **jsdom** - Browser environment simulation

---

## 📦 Build & Deployment

### **Build for Production**

```bash
pnpm build
```

This command:

1. Compiles TypeScript with strict type checking
2. Bundles frontend with Vite (optimized for production)
3. Prepares all packages for deployment

### **Output Artifacts**

- Frontend bundle: Optimized JavaScript, CSS, and assets ready for static hosting
- Backend: TypeScript compiled to JavaScript (ready to run on Node.js)

---

## 🤝 Contributing

### **Development Workflow**

1. Create a feature branch

   ```bash
   git checkout -b feature/your-feature
   ```

2. Make changes and ensure tests pass

   ```bash
   pnpm test
   ```

3. Format and lint (if configured)

   ```bash
   pnpm build
   ```

4. Commit and push

   ```bash
   git commit -m "feat: add your feature"
   git push origin feature/your-feature
   ```

### **Code Standards**

- TypeScript strict mode enabled
- ESM modules
- React functional components with hooks
- Comprehensive test coverage
