# ElectroStock PostgreSQL Database Design

This schema is the source of truth for the Prisma implementation.

## Enums

```sql
CREATE TYPE user_role AS ENUM ('ADMIN', 'STORE_MANAGER', 'SALES_PERSON');
CREATE TYPE inventory_transaction_type AS ENUM ('STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT', 'SALE', 'RETURN');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'OTHER');
CREATE TYPE sale_status AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE notification_type AS ENUM ('LOW_STOCK', 'STOCK_MOVEMENT', 'SALE_CREATED', 'SYSTEM');
```

## Tables

### users

Stores application users, roles, password hashes, and business profile fields.

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  password VARCHAR(128) NOT NULL,
  last_login TIMESTAMPTZ,
  is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
  username VARCHAR(150) NOT NULL UNIQUE,
  first_name VARCHAR(150) NOT NULL DEFAULT '',
  last_name VARCHAR(150) NOT NULL DEFAULT '',
  email VARCHAR(254) NOT NULL UNIQUE,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role user_role NOT NULL DEFAULT 'SALES_PERSON',
  phone VARCHAR(32),
  avatar VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### categories

```sql
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Seed categories: TVs, Speakers, Refrigerators, Air Conditioners, Laptops, Mobile Phones, Accessories.

### suppliers

```sql
CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  contact_person VARCHAR(180),
  email VARCHAR(254),
  phone VARCHAR(32),
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### products

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  name VARCHAR(180) NOT NULL,
  sku VARCHAR(80) NOT NULL UNIQUE,
  barcode VARCHAR(120) UNIQUE,
  brand VARCHAR(120),
  model_number VARCHAR(120),
  description TEXT,
  image VARCHAR(255),
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12, 2) NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_id BIGINT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT products_non_negative_stock CHECK (quantity_on_hand >= 0),
  CONSTRAINT products_valid_prices CHECK (cost_price >= 0 AND selling_price >= 0)
);

CREATE INDEX products_name_idx ON products USING GIN (to_tsvector('english', name));
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_supplier_idx ON products(supplier_id);
```

### supplier_product_history

```sql
CREATE TABLE supplier_product_history (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  product_id BIGINT NOT NULL REFERENCES products(id),
  unit_cost NUMERIC(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  supplied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_id BIGINT REFERENCES users(id)
);
```

### sales

```sql
CREATE TABLE sales (
  id BIGSERIAL PRIMARY KEY,
  sale_number VARCHAR(40) NOT NULL UNIQUE,
  customer_name VARCHAR(180),
  customer_phone VARCHAR(32),
  status sale_status NOT NULL DEFAULT 'COMPLETED',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method payment_method NOT NULL DEFAULT 'CASH',
  notes TEXT,
  created_by_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sales_valid_amounts CHECK (
    subtotal >= 0 AND discount_amount >= 0 AND total_amount >= 0
  )
);

CREATE INDEX sales_created_at_idx ON sales(created_at);
CREATE INDEX sales_created_by_idx ON sales(created_by_id);
```

### sale_items

```sql
CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) NOT NULL,
  CONSTRAINT sale_items_positive_quantity CHECK (quantity > 0),
  CONSTRAINT sale_items_valid_amounts CHECK (
    unit_price >= 0 AND discount_amount >= 0 AND line_total >= 0
  )
);

CREATE INDEX sale_items_sale_idx ON sale_items(sale_id);
CREATE INDEX sale_items_product_idx ON sale_items(product_id);
```

### inventory_transactions

```sql
CREATE TABLE inventory_transactions (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id),
  transaction_type inventory_transaction_type NOT NULL,
  quantity INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  unit_cost NUMERIC(12, 2),
  reference VARCHAR(120),
  reason TEXT,
  sale_id BIGINT REFERENCES sales(id),
  supplier_id BIGINT REFERENCES suppliers(id),
  created_by_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX inventory_transactions_product_idx ON inventory_transactions(product_id);
CREATE INDEX inventory_transactions_created_at_idx ON inventory_transactions(created_at);
```

### notifications

```sql
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id BIGINT REFERENCES users(id),
  notification_type notification_type NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  product_id BIGINT REFERENCES products(id),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX notifications_recipient_idx ON notifications(recipient_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
```

## Data Integrity Rules

- Sales and stock reductions must be wrapped in one database transaction.
- Product stock cannot become negative.
- Sale item totals are recalculated server-side.
- Low-stock notifications are generated after stock-changing events.
- Deleting products, suppliers, or categories should default to soft deactivation when historical records exist.
