# Project Overview

This project is a modern, production-ready web application scaffold built with **Next.js 15**, **TypeScript 5**, and **Tailwind CSS 4**. It leverages **shadcn/ui** for high-quality UI components, **Prisma** as an ORM for database interactions, and **NextAuth.js** for secure authentication. The scaffold is designed to accelerate development and is optimized for AI assistance, particularly with Z.ai.

Key features include:
*   **Core Frameworks**: Next.js 15 (App Router), TypeScript 5, Tailwind CSS 4.
*   **UI/Styling**: shadcn/ui, Lucide React, Framer Motion, Next Themes.
*   **Forms & Validation**: React Hook Form, Zod.
*   **State Management & Data Fetching**: Zustand, TanStack Query, Axios.
*   **Database & Backend**: Prisma, NextAuth.js.
*   **Advanced UI**: TanStack Table, DND Kit, Recharts, Sharp (image processing).
*   **Internationalization & Utilities**: Next Intl, Date-fns, ReactUse.

# Building and Running

To get started with this project, follow these steps:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The application will be accessible at `http://localhost:3000`.

3.  **Build for Production**:
    ```bash
    npm run build
    ```

4.  **Start Production Server**:
    ```bash
    npm start
    ```

# Development Conventions

This project adheres to the following development conventions:

*   **Language**: TypeScript is used throughout the codebase for type safety and improved developer experience.
*   **Styling**: Tailwind CSS is the primary framework for styling, promoting a utility-first approach.
*   **Linting**: ESLint is configured (as indicated by `eslint.config.mjs`) to enforce code quality and consistency.
*   **Database Interaction**: Prisma is used for all database operations, providing a type-safe and efficient ORM.
*   **Routing**: Next.js App Router is utilized for defining routes and managing application pages.
*   **Component Structure**: Reusable React components are organized under the `src/components/` directory, with `shadcn/ui` components specifically in `src/components/ui/`.
*   **Utility Functions**: Common utility functions and configurations are located in `src/lib/`.
*   **Custom Hooks**: Custom React hooks are defined in `src/hooks/`.
