# FreshTrack 🥬

A smart grocery and asset management system that helps you track expiry dates, manage inventory, and reduce food waste. Built with modern web technologies and designed for ease of use.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Scripts](#scripts)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **Smart Expiry Tracking** - Keep track of expiry dates for all your grocery items
- **Inventory Management** - Monitor stock levels and quantities
- **Asset Tracking** - Manage household and business assets
- **Real-time Updates** - Get notifications before items expire
- **User-Friendly Interface** - Intuitive React-based frontend
- **Type-Safe API** - Generated API clients with Zod validation
- **Scalable Architecture** - Monorepo structure for easy maintenance and scaling

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Query** - Server state management

### Backend
- **Node.js 24** - Runtime
- **Express 5** - API framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database access

### Tools & Libraries
- **pnpm** - Monorepo package manager
- **Zod** - Schema validation
- **Orval** - OpenAPI client generation
- **esbuild** - JavaScript bundler
- **Framer Motion** - Animation library

## 📁 Project Structure

```
FreshTrack/
├── artifacts/                    # Deployable applications
│   ├── grocery-tracker/         # React + Vite frontend
│   └── api-server/              # Express API server
├── lib/                         # Shared libraries
│   ├── api-spec/               # OpenAPI specification
│   ├── api-client-react/       # Generated React Query hooks
│   ├── api-zod/                # Generated Zod schemas
│   ├── db/                     # Drizzle ORM schema & DB connection
│   └── integrations/           # External integrations
├── scripts/                    # Utility scripts
├── pnpm-workspace.yaml        # Workspace configuration
├── tsconfig.base.json         # Shared TypeScript config
├── tsconfig.json              # Root TypeScript config
└── package.json               # Root package manifest
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 24 or higher
- **pnpm** package manager (`npm install -g pnpm`)
- **PostgreSQL** database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/saiprasad0905/FreshTrack.git
   cd FreshTrack
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   # Create .env file in api-server package
   cp artifacts/api-server/.env.example artifacts/api-server/.env
   
   # Update database connection and other configs
   ```

4. **Setup database**
   ```bash
   pnpm --filter @workspace/db run migrate
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```

   This starts both the frontend and backend in development mode.

## 💻 Development

### Type Checking

Always run type checking from the root directory to ensure all packages are properly typed:

```bash
pnpm run typecheck
```

This command:
- Runs TypeScript compiler in build mode
- Validates cross-package dependencies
- Only emits declaration files (`.d.ts`)

### Building

Build the entire project:

```bash
pnpm run build
```

This command:
- Runs type checking first
- Builds all packages that have a `build` script
- Generates production-ready code

### Working with Monorepo

The project uses pnpm workspaces with TypeScript project references. When developing:

- **Add a dependency**: `pnpm --filter <package-name> add <dependency>`
- **Run a script in a package**: `pnpm --filter <package-name> run <script>`
- **Work in specific package**: `cd artifacts/grocery-tracker && pnpm dev`

## 📝 Scripts

### Root Scripts

| Script | Description |
|--------|-------------|
| `pnpm run build` | Build all packages |
| `pnpm run typecheck` | TypeScript type checking |
| `pnpm dev` | Start development servers |

### Frontend Scripts

```bash
cd artifacts/grocery-tracker
pnpm dev      # Start dev server
pnpm build    # Build for production
pnpm preview  # Preview production build
```

### Backend Scripts

```bash
cd artifacts/api-server
pnpm dev      # Start dev server with auto-reload
pnpm build    # Build for production
pnpm start    # Run production build
```

## 🔌 API Documentation

The API is built with Express and follows OpenAPI specifications. 

- **OpenAPI Spec**: See `lib/api-spec/` directory
- **Generated Clients**: Auto-generated from OpenAPI specs using Orval
- **Validation**: Zod schemas for runtime validation

## 📚 Database

Using **Drizzle ORM** for type-safe database operations:

- **Location**: `lib/db/`
- **Migration**: `pnpm --filter @workspace/db run migrate`
- **Seeds**: `pnpm --filter @workspace/db run seed`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All TypeScript types are properly defined
- Code follows the existing style
- Tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ by the FreshTrack team**
