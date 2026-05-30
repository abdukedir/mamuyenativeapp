# ElectroStock Node Backend Folder Structure

```text
backend/
  package.json
  tsconfig.json
  .env.example
  prisma/
    schema.prisma
    seed.ts
  src/
    server.ts
    app.ts
    config/
      env.ts
      prisma.ts
      swagger.ts
    middlewares/
      auth.middleware.ts
      error.middleware.ts
      not-found.middleware.ts
      rate-limit.middleware.ts
      upload.middleware.ts
      validate.middleware.ts
    modules/
      auth/
        auth.controller.ts
        auth.routes.ts
        auth.schemas.ts
        auth.service.ts
      dashboard/
        dashboard.controller.ts
        dashboard.routes.ts
        dashboard.service.ts
      products/
        product.controller.ts
        product.repository.ts
        product.routes.ts
        product.schemas.ts
        product.service.ts
      suppliers/
        supplier.controller.ts
        supplier.routes.ts
      inventory/
        inventory.controller.ts
        inventory.repository.ts
        inventory.routes.ts
        inventory.schemas.ts
        inventory.service.ts
      sales/
        sale.controller.ts
        sale.repository.ts
        sale.routes.ts
        sale.schemas.ts
        sale.service.ts
      notifications/
        notification.controller.ts
        notification.routes.ts
    types/
      express.d.ts
    utils/
      api-error.ts
      async-handler.ts
      logger.ts
      password.ts
      tokens.ts
  uploads/
  logs/
```

## Module Rules

- Controllers never call Prisma directly.
- Services own business logic and database transactions.
- Repositories own raw Prisma query shape.
- Zod validates all request input.
- Middleware owns auth, role checks, uploads, rate limiting, and error formatting.
- API routes are mounted under `/api/v1`.

