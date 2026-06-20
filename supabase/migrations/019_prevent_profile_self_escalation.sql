-- Migration 019: Prevent privilege escalation via profiles self-update
--
-- The "profiles_update_own" policy (006_rls.sql) allows a user to UPDATE their
-- own row with no WITH CHECK on which columns change. That let any user set
-- their own role to 'system_admin'. This trigger enforces, at the database
-- level, who is allowed to change the privileged columns (role,
-- organization_id, is_active) regardless of which RLS UPDATE policy applies.

CREATE OR REPLACE FUNCTION public.enforce_profile_privilege_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Nothing privileged changed: always allow (covers normal self-edits like
  -- full_name, consent fields, etc.)
  IF NEW.role IS NOT DISTINCT FROM OLD.role
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id
     AND NEW.is_active IS NOT DISTINCT FROM OLD.is_active THEN
    RETURN NEW;
  END IF;

  -- Platform admins (system_admin, support) may change privileged columns.
  IF public.auth_is_admin() THEN
    RETURN NEW;
  END IF;

  -- Client admins may manage members within their own organization, but may
  -- never assign or remove platform-admin roles.
  IF public.auth_user_role() = 'client_admin'
     AND OLD.organization_id IS NOT DISTINCT FROM public.auth_user_org_id()
     AND NEW.organization_id IS NOT DISTINCT FROM public.auth_user_org_id()
     AND NEW.role NOT IN ('system_admin', 'support')
     AND OLD.role NOT IN ('system_admin', 'support') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authorized to modify role, organization, or active status';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_privilege_columns ON public.profiles;
CREATE TRIGGER enforce_profile_privilege_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_profile_privilege_columns();
