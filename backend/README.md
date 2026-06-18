# ElectroStock Backend

Node.js, Express.js, TypeScript, PostgreSQL, and Prisma API for the ElectroStock electronics inventory system.

## Modules

- Auth with JWT access and refresh tokens.
- Products with category, barcode, image upload, search, and filters.
- Inventory with stock in, stock out, adjustment, and movement history.
- Sales with multiple line items, discounts, payment methods, and invoice-ready totals.
- Dashboard, suppliers, reports, and notifications.

## Development

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Generate Prisma client with `npm run prisma:generate`.
4. Run migrations with `npm run prisma:migrate`.
5. Start the API with `npm run dev`.

## Firebase Admin

This backend is prepared for Firebase Admin with `backend/src/config/firebase.ts`.
Create a Firebase service account key in your Firebase project settings and copy
these values into `backend/.env`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

Use `authenticateFirebase` from `src/middlewares/firebase-auth.middleware.ts` on
routes that should accept Firebase ID tokens from the mobile app. Existing JWT
auth remains available through `authenticate`.
