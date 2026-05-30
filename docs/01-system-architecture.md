# ElectroStock System Architecture

ElectroStock is a production-oriented electronics inventory management system for stores and warehouses. It has an Expo React Native mobile client and a Node.js Express API backed by PostgreSQL through Prisma ORM.

## Platform

- Mobile app: Expo SDK 56, React Native, TypeScript, Expo Router/React Navigation, TanStack Query, Axios, Zustand, React Hook Form, Zod, NativeWind-ready styling, and dark mode.
- API: Node.js, Express.js, TypeScript, Prisma ORM, PostgreSQL, JWT authentication, role-based access control, Multer uploads, Swagger/OpenAPI, Winston logging, rate limiting, and centralized error handling.
- Database: PostgreSQL with normalized tables for users, products, categories, suppliers, sales, inventory transactions, notifications, and refresh tokens.

## Architecture Pattern

The backend uses MVC plus service and repository boundaries:

- Routes: API versioning and HTTP method mapping.
- Controllers: request/response orchestration.
- Validation: Zod schemas at the request boundary.
- Services: business logic, authorization-aware workflows, transactions.
- Repositories: Prisma data access.
- Middleware: authentication, role checks, rate limiting, uploads, errors, logging.

The frontend uses feature-first organization:

- Screens remain thin.
- Feature folders own API calls, schemas, and types.
- TanStack Query owns server state.
- Zustand owns session and local UI state.
- Axios owns request/refresh-token behavior.

## Primary API Modules

- Auth: login, logout, refresh token, change password, profile.
- Dashboard: totals, revenue, low-stock counts, recent activities.
- Products: CRUD, image upload, barcode, category, search, filters.
- Suppliers: CRUD and supplier history.
- Inventory: stock in, stock out, adjustments, history.
- Sales: sale creation, multiple items, discounts, payment method, invoice data.
- Reports: daily, weekly, monthly, top-selling, revenue.
- Notifications: low-stock and new-sale alerts.

## Role Permissions

- Admin: full access to all modules and staff management.
- Store Manager: products, suppliers, inventory, sales, reports, notifications.
- Sales Person: dashboard summary, product lookup, sales creation, own profile.

## Request Flow

1. The mobile app sends credentials to `POST /api/v1/auth/login`.
2. The API validates input, verifies bcrypt password hash, and issues access/refresh JWTs.
3. Axios attaches the access token to protected requests.
4. Express middleware verifies the token and attaches the user context.
5. Role middleware checks whether the user may access the route.
6. Controllers validate request bodies with Zod.
7. Services run business logic and Prisma transactions.
8. Repositories isolate Prisma queries.
9. Errors flow through centralized error middleware.
10. Winston writes structured logs.

## Production Concerns

- Short-lived access tokens and refresh token rotation.
- Helmet security headers and CORS allow-list.
- Rate limiting on auth and write endpoints.
- Prisma transactions for stock and sale mutations.
- Server-side total calculations for sales.
- Secure upload limits and MIME validation.
- Environment variables for secrets, URLs, storage, and database.
- Swagger docs at `/api/docs` in non-sensitive environments.

