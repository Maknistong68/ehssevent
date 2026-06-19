-- Migration 012: Add 'compliance' inspection field type
-- NOTE: Postgres cannot add an enum value and use it in the same transaction.
-- This migration MUST run standalone, before any code/migration references the value.

ALTER TYPE public.inspection_field_type ADD VALUE IF NOT EXISTS 'compliance';
