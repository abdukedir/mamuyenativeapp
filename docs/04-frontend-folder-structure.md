# ElectroStock Frontend Folder Structure

This project uses Expo SDK 56 with file-based routing through Expo Router. Expo Router is built on React Navigation, so stack/tabs/drawer behavior should be exposed through route layouts and navigation helpers.

```text
src/
  app/
    _layout.tsx
    index.tsx
    explore.tsx
    (auth)/
      login.tsx
      change-password.tsx
    (tabs)/
      dashboard.tsx
      products.tsx
      sales.tsx
      reports.tsx
      settings.tsx
  components/
    forms/
      FormField.tsx
      SubmitButton.tsx
    inventory/
      ProductCard.tsx
      StockBadge.tsx
      SaleItemRow.tsx
    layout/
      AppHeader.tsx
      Screen.tsx
      StatCard.tsx
    ui/
      collapsible.tsx
  constants/
    theme.ts
  features/
    auth/
      api.ts
      schemas.ts
      types.ts
    dashboard/
      api.ts
      types.ts
    products/
      api.ts
      schemas.ts
      types.ts
    suppliers/
      api.ts
      schemas.ts
      types.ts
    inventory/
      api.ts
      schemas.ts
      types.ts
    sales/
      api.ts
      schemas.ts
      types.ts
    reports/
      api.ts
      types.ts
    notifications/
      api.ts
      types.ts
  hooks/
    use-color-scheme.ts
    use-theme.ts
  lib/
    api-client.ts
    query-client.ts
    storage.ts
  navigation/
    routes.ts
  stores/
    auth-store.ts
    ui-store.ts
  types/
    api.ts
    roles.ts
```

## Frontend Rules

- API calls live in feature `api.ts` files and use the shared Axios client.
- Server state lives in TanStack Query.
- Client-only state lives in Zustand.
- Forms use React Hook Form and Zod schemas from the feature folder.
- Screens stay thin: compose components, call hooks, and render states.
- Role-based UI checks are centralized in auth helpers and route guards.
- Dark mode reads from the existing color-scheme/theme flow.
