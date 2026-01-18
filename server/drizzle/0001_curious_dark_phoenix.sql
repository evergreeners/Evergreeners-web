ALTER TABLE "evergreeners"."users" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "anonymous_name" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");