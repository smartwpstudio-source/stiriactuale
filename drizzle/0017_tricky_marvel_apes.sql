CREATE TABLE "scheduled_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"text" text NOT NULL,
	"pin" boolean DEFAULT false NOT NULL,
	"sent_at" timestamp with time zone
);
