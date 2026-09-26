#!/bin/bash
# Auto-switch Prisma schema based on DATABASE_URL
# If DATABASE_URL starts with postgres:// or postgresql:// → use Supabase schema
# Otherwise → use SQLite schema (local dev)

set -e

SCHEMA_DIR="/home/z/my-project/prisma"
DB_URL="${DATABASE_URL:-}"

if [[ "$DB_URL" == postgres://* ]] || [[ "$DB_URL" == postgresql://* ]]; then
  echo "📡 Using Supabase (PostgreSQL) schema"
  cp "$SCHEMA_DIR/schema.supabase.prisma" "$SCHEMA_DIR/schema.prisma"
else
  echo "💾 Using local SQLite schema"
  cp "$SCHEMA_DIR/schema.sqlite.prisma" "$SCHEMA_DIR/schema.prisma"
fi

echo "✓ Schema ready. Running prisma db push..."
bunx prisma db push --accept-data-loss
echo "✓ Database synced."
