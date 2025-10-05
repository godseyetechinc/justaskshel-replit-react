-- ============================================================================
-- MFA CONFIGURATION SEED DATA
-- ============================================================================
-- Created: October 5, 2025
-- Description: Initialize MFA configuration with default settings
-- Dependencies: Requires mfa_config table and users table
-- Execution Order: 05 (after core data seed)
-- Idempotent: Yes
-- ============================================================================

BEGIN;

-- ============================================================================
-- Insert default MFA configuration
-- ============================================================================

-- Check if configuration already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.mfa_config LIMIT 1) THEN
        -- Insert default MFA configuration
        INSERT INTO public.mfa_config (
            enable_mfa,
            enforcement_mode,
            bypass_emails,
            updated_by,
            updated_at,
            created_at
        ) VALUES (
            false,  -- MFA disabled by default for new installations
            'optional',  -- When enabled, MFA is optional for all users
            '[]'::jsonb,  -- No bypass emails by default
            NULL,  -- No admin user for initial setup
            now(),
            now()
        );
        
        RAISE NOTICE 'Default MFA configuration created successfully';
    ELSE
        RAISE NOTICE 'MFA configuration already exists, skipping seed';
    END IF;
END $$;

-- ============================================================================
-- Configuration options explained:
-- ============================================================================
-- enable_mfa: Master switch for MFA functionality
--   - false: MFA completely disabled (no setup options shown)
--   - true: MFA features enabled according to enforcement_mode
--
-- enforcement_mode: How MFA is enforced
--   - 'disabled': MFA completely disabled (same as enable_mfa = false)
--   - 'optional': Users can choose to enable MFA (recommended)
--   - 'required_admins': SuperAdmin and TenantAdmin must use MFA
--   - 'required_all': All users must use MFA
--
-- bypass_emails: Array of email addresses exempt from MFA requirements
--   - Example: '["admin@example.com", "emergency@example.com"]'::jsonb
--   - Useful for emergency access or testing
--
-- updated_by: User ID who last modified the configuration
--   - Tracked for audit purposes
-- ============================================================================

-- ============================================================================
-- To enable MFA for your installation, run:
-- ============================================================================
-- UPDATE public.mfa_config 
-- SET enable_mfa = true,
--     enforcement_mode = 'optional',  -- or 'required_admins' / 'required_all'
--     updated_at = now()
-- WHERE id = (SELECT id FROM public.mfa_config LIMIT 1);
-- ============================================================================

COMMIT;

-- Verification
SELECT 
    'MFA Configuration Status:' as status,
    enable_mfa,
    enforcement_mode,
    created_at
FROM public.mfa_config
LIMIT 1;

