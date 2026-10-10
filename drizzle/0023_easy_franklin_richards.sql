ALTER TABLE "push_subscriptions" ADD COLUMN "scope" varchar(10) DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "raion" varchar(50);--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "country" varchar(50);