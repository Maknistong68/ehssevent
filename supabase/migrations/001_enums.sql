-- Migration 001: Create custom enums
CREATE TYPE public.org_type AS ENUM ('client', 'contractor');

CREATE TYPE public.user_role AS ENUM (
  'system_admin',
  'support',
  'client_admin',
  'client_manager',
  'client_user',
  'contractor_user'
);

CREATE TYPE public.observation_category AS ENUM (
  'unsafe_act',
  'unsafe_condition',
  'near_miss',
  'environmental',
  'positive_observation',
  'other'
);

CREATE TYPE public.observation_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE public.observation_status AS ENUM (
  'open',
  'in_progress',
  'pending_review',
  'closed',
  'overdue'
);
