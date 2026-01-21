CREATE TABLE "evergreeners"."goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"target" integer NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"due_date" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "evergreeners"."goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "evergreeners"."users"("id") ON DELETE no action ON UPDATE no action;