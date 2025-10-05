-- ============================================================================
-- AUTHENTICATION & SECURITY TABLES (PHASE 2 ENHANCEMENTS)
-- ============================================================================
-- Created: October 5, 2025
-- Description: Phase 2 authentication enhancement tables including account
--              lockout, password reset, MFA, and login history tracking
-- Dependencies: Requires users table to exist
-- ============================================================================

-- ============================================================================
-- Account Lockout System
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.account_lockouts_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.account_lockouts (
    id integer PRIMARY KEY DEFAULT nextval('public.account_lockouts_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    failed_attempts integer DEFAULT 0 NOT NULL,
    last_failed_at timestamp without time zone,
    locked_until timestamp without time zone,
    locked_at timestamp without time zone,
    unlocked_at timestamp without time zone,
    lock_reason character varying(255),
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.account_lockouts_id_seq OWNED BY public.account_lockouts.id;

COMMENT ON TABLE public.account_lockouts IS 'Tracks account lockout status to prevent brute force attacks';
COMMENT ON COLUMN public.account_lockouts.failed_attempts IS 'Number of consecutive failed login attempts';
COMMENT ON COLUMN public.account_lockouts.locked_until IS 'Timestamp when the account lockout expires (15 minutes default)';

-- ============================================================================
-- Password Reset Tokens
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.password_reset_tokens_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id integer PRIMARY KEY DEFAULT nextval('public.password_reset_tokens_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    token character varying(255) UNIQUE NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;

COMMENT ON TABLE public.password_reset_tokens IS 'Crypto-secure password reset tokens with 1-hour expiration';
COMMENT ON COLUMN public.password_reset_tokens.token IS 'Cryptographically secure random token (32 bytes)';
COMMENT ON COLUMN public.password_reset_tokens.used_at IS 'Timestamp when token was used (one-time use only)';

-- ============================================================================
-- Multi-Factor Authentication Settings
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.mfa_settings_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.mfa_settings (
    id integer PRIMARY KEY DEFAULT nextval('public.mfa_settings_id_seq'),
    user_id character varying UNIQUE NOT NULL REFERENCES public.users(id),
    mfa_enabled boolean DEFAULT false NOT NULL,
    totp_secret character varying(255),
    backup_codes jsonb,
    recovery_email character varying(255),
    enabled_at timestamp without time zone,
    last_verified_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.mfa_settings_id_seq OWNED BY public.mfa_settings.id;

COMMENT ON TABLE public.mfa_settings IS 'User MFA/2FA settings including TOTP secrets and backup codes';
COMMENT ON COLUMN public.mfa_settings.totp_secret IS 'Encrypted TOTP secret for authenticator apps';
COMMENT ON COLUMN public.mfa_settings.backup_codes IS 'Array of hashed backup recovery codes (8 codes)';

-- ============================================================================
-- MFA Verification Attempts
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.mfa_verification_attempts_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.mfa_verification_attempts (
    id integer PRIMARY KEY DEFAULT nextval('public.mfa_verification_attempts_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    attempt_type character varying(20) CHECK (attempt_type IN ('totp', 'sms', 'recovery')) NOT NULL,
    success boolean NOT NULL,
    ip_address character varying(45),
    user_agent text,
    attempted_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.mfa_verification_attempts_id_seq OWNED BY public.mfa_verification_attempts.id;

COMMENT ON TABLE public.mfa_verification_attempts IS 'Audit trail of all MFA verification attempts';
COMMENT ON COLUMN public.mfa_verification_attempts.attempt_type IS 'Type of MFA verification: TOTP, SMS, or recovery code';

-- ============================================================================
-- Login History Tracking
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.login_history_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.login_history (
    id integer PRIMARY KEY DEFAULT nextval('public.login_history_id_seq'),
    user_id character varying REFERENCES public.users(id),
    email character varying(255) NOT NULL,
    success boolean NOT NULL,
    failure_reason character varying(255),
    ip_address character varying(45),
    user_agent text,
    location character varying(255),
    device_type character varying(50),
    organization_id integer REFERENCES public.agent_organizations(id),
    mfa_used boolean DEFAULT false,
    session_id character varying(255),
    logged_in_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.login_history_id_seq OWNED BY public.login_history.id;

COMMENT ON TABLE public.login_history IS 'Comprehensive login activity tracking for security auditing';
COMMENT ON COLUMN public.login_history.success IS 'Whether the login attempt was successful';
COMMENT ON COLUMN public.login_history.mfa_used IS 'Whether MFA was used during this login';

-- ============================================================================
-- MFA Configuration (Runtime Settings)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.mfa_config_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.mfa_config (
    id integer PRIMARY KEY DEFAULT nextval('public.mfa_config_id_seq'),
    enable_mfa boolean DEFAULT false NOT NULL,
    enforcement_mode character varying(50) CHECK (enforcement_mode IN ('disabled', 'optional', 'required_admins', 'required_all')) DEFAULT 'optional' NOT NULL,
    bypass_emails jsonb,
    updated_by character varying REFERENCES public.users(id),
    updated_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.mfa_config_id_seq OWNED BY public.mfa_config.id;

COMMENT ON TABLE public.mfa_config IS 'System-wide MFA configuration settings';
COMMENT ON COLUMN public.mfa_config.enforcement_mode IS 'MFA enforcement mode: disabled, optional, required_admins, or required_all';
COMMENT ON COLUMN public.mfa_config.bypass_emails IS 'Array of email addresses exempt from MFA requirements';

-- ============================================================================
-- Organization Access Requests
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.organization_access_requests_id_seq AS integer;

CREATE TABLE IF NOT EXISTS public.organization_access_requests (
    id integer PRIMARY KEY DEFAULT nextval('public.organization_access_requests_id_seq'),
    user_id character varying NOT NULL REFERENCES public.users(id),
    organization_id integer NOT NULL REFERENCES public.agent_organizations(id),
    status character varying(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    requested_role character varying(50),
    reason text,
    reviewed_by character varying REFERENCES public.users(id),
    review_notes text,
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER SEQUENCE public.organization_access_requests_id_seq OWNED BY public.organization_access_requests.id;

COMMENT ON TABLE public.organization_access_requests IS 'User requests to join organizations with admin approval workflow';
COMMENT ON COLUMN public.organization_access_requests.status IS 'Request status: pending, approved, or rejected';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Account Lockouts Indexes
CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON public.account_lockouts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_locked_until ON public.account_lockouts USING btree (locked_until);

-- Password Reset Tokens Indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);

-- MFA Settings Indexes
CREATE INDEX IF NOT EXISTS idx_mfa_settings_user_id ON public.mfa_settings USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_settings_enabled ON public.mfa_settings USING btree (mfa_enabled);

-- MFA Verification Attempts Indexes
CREATE INDEX IF NOT EXISTS idx_mfa_verification_user_id ON public.mfa_verification_attempts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_attempted_at ON public.mfa_verification_attempts USING btree (attempted_at);

-- Login History Indexes
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON public.login_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_logged_in_at ON public.login_history USING btree (logged_in_at);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON public.login_history USING btree (success);
CREATE INDEX IF NOT EXISTS idx_login_history_ip_address ON public.login_history USING btree (ip_address);

-- Organization Access Requests Indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON public.organization_access_requests USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_org ON public.organization_access_requests USING btree (organization_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.organization_access_requests USING btree (status);

-- ============================================================================
-- END OF AUTHENTICATION TABLES SCRIPT
-- ============================================================================

SELECT 'Phase 2 Authentication Tables Created Successfully' as status;

