# Database Migrations - MariaDB

This directory contains database migration scripts for the Income-Expense Tracker application, migrated from SQLite to MariaDB/MySQL.

## 📋 Migration Overview

The migrations are designed to set up the complete database schema for a POS (Point of Sale) system with income/expense tracking capabilities.

## 🗂️ Migration Files (Run in Order)

### 1. Core Tables (Handled by `database.js`)
The main application tables are automatically created when the server starts:
- `users` - User accounts and authentication
- `transactions` - Income and expense transactions
- `categories` - Transaction categories
- `backup_settings` - Backup configuration
- `menu_categories` - POS menu categories
- `menu_options` - Menu items within categories
- `noodles` - Noodle type options for POS
- `sales` - POS sales records
- `sale_items` - Individual items in each sale

### 2. Menu Management Tables
**File:** `add-menu-tables.js`  
**Purpose:** Creates extended menu management tables for the POS system
**Tables Created:**
- `menu_categories` - Menu categories with ordering
- `menu_options` - Menu items with prices
- `noodles` - Noodle types
- `pos_sales` - Extended sales table with order references
- `pos_sale_items` - Extended sale items with menu references

**Run:**
```bash
node migrations/add-menu-tables.js
```

### 3. Menu Data Seeding
**File:** `seed-menu-data.js`  
**Purpose:** Seeds initial menu data for Thai noodle restaurant
**Data Inserted:**
- 5 menu categories (ต้มยำ, น้ำใส, เย็นตาโฟ, เครื่องดื่ม, อาหารเพิ่ม)
- 7 noodle types
- 28 menu options with pricing

**Run:**
```bash
node migrations/seed-menu-data.js
```

### 4. POS Sales Tables
**File:** `add-pos-tables.js`  
**Purpose:** Creates dedicated POS sales tracking tables
**Tables Created:**
- `pos_sales` - Sales with payment methods and notes
- `pos_sale_items` - Line items with menu references

**Run:**
```bash
node migrations/add-pos-tables.js
```

### 5. Schema Updates
**File:** `update-pos-schema.js`  
**Purpose:** Adds menu reference columns to existing sale_items table
**Changes:**
- Adds `category_id`, `option_id`, `noodle_id` columns
- Adds `is_custom` flag for custom items
- Creates foreign key constraints to menu tables

**Run:**
```bash
node migrations/update-pos-schema.js
```

## 🚀 Running All Migrations

Use the master migration runner to execute all migrations in the correct order:

```bash
node migrations/run-all-migrations.js
```

This script will:
1. Check database connectivity
2. Run migrations in sequence
3. Track completed migrations
4. Skip already-executed migrations
5. Report any errors

## 🔧 Environment Configuration

Ensure your `.env` file contains the MariaDB connection settings:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tracker_user
DB_PASSWORD=tracker_pass
DB_NAME=income_expense_tracker
```

## 📊 Database Schema Overview

### Core Application Tables
```
users
├── transactions (FK: userId)
└── categories (FK: userId)

backup_settings
```

### POS Menu Tables
```
menu_categories
├── menu_options (FK: category_id)
└── (referenced by sale_items)

noodles
└── (referenced by sale_items)
```

### POS Sales Tables
```
users
├── sales (FK: userId)
│   └── sale_items (FK: saleId)
│       ├── (FK: category_id → menu_categories)
│       ├── (FK: option_id → menu_options)
│       └── (FK: noodle_id → noodles)
│
└── pos_sales (FK: created_by)
    ├── (FK: transaction_id → transactions)
    └── pos_sale_items (FK: sale_id)
        ├── (FK: menu_category_id → menu_categories)
        ├── (FK: menu_option_id → menu_options)
        └── (FK: noodle_id → noodles)
```

## ⚠️ Important Notes

### Idempotency
All migrations use `CREATE TABLE IF NOT EXISTS` and check for existing columns before adding them. This makes migrations safe to re-run.

### Foreign Key Constraints
- All foreign keys use appropriate `ON DELETE` actions:
  - `CASCADE` - Delete dependent records
  - `SET NULL` - Nullify reference (for optional relationships)

### Character Set
All tables use `utf8mb4` with `utf8mb4_unicode_ci` collation for full Unicode support (including Thai language and emojis).

### Indexes
Tables include indexes on:
- Primary keys (automatic)
- Foreign keys
- Frequently queried columns (date, status, display_order)

## 🔄 Migration Best Practices

1. **Always backup** before running migrations on production data
2. **Test migrations** on a development database first
3. **Run in order** - migrations may have dependencies
4. **Check logs** - each migration outputs status messages
5. **Verify data** - check that seeded data appears correctly

## 🐛 Troubleshooting

### Connection Errors
- Verify MariaDB/MySQL is running
- Check `.env` configuration
- Ensure user has proper permissions

### Foreign Key Errors
- Run migrations in the correct order
- Ensure referenced tables exist before creating dependent tables

### Duplicate Key Errors
- Safe to ignore if re-running migrations (indicates already executed)
- Use `DROP TABLE IF EXISTS` only for development resets

## 📝 Adding New Migrations

When creating new migrations:

1. Use descriptive filenames (e.g., `add-inventory-tables.js`)
2. Include proper error handling
3. Add status logging
4. Make idempotent (safe to re-run)
5. Update this README with the new migration
6. Update `run-all-migrations.js` to include the new migration

## 🔍 Migration Status

Check which migrations have been executed by querying:

```sql
SELECT * FROM migration_history ORDER BY executed_at DESC;
```

(Once migration tracking is implemented)
