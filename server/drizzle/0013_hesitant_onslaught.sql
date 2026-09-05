ALTER TABLE "evergreeners"."users" ADD COLUMN IF NOT EXISTS "password_login_disabled" boolean DEFAULT false;
