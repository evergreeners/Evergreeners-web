CREATE TABLE "evergreeners"."watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"github_username" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"added_at" timestamp DEFAULT now(),
	"cached_stats" jsonb,
	"last_refreshed" timestamp,
	CONSTRAINT "watchlist_user_id_github_username_unique" UNIQUE("user_id","github_username")
);
--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "eye_insight" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "eye_insight_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "eye_insight_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "academy_status" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "academy_joined_at" timestamp;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "academy_pr_url" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."users" ADD COLUMN "academy_cert_id" text;--> statement-breakpoint
ALTER TABLE "evergreeners"."watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "evergreeners"."users"("id") ON DELETE cascade ON UPDATE no action;