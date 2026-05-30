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
