CREATE TABLE "agent_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" varchar NOT NULL,
	"policy_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"commission_type" varchar NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"base_amount" numeric(10, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"payment_status" varchar DEFAULT 'pending',
	"payment_date" timestamp,
	"payment_method" varchar(50),
	"payment_reference" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_id" integer NOT NULL,
	"from_agent_id" varchar,
	"to_agent_id" varchar NOT NULL,
	"transferred_by" varchar NOT NULL,
	"transfer_reason" text NOT NULL,
	"transfer_type" varchar DEFAULT 'servicing',
	"transferred_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "agent_organizations" ADD COLUMN "is_system_organization" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "agent_organizations" ADD COLUMN "is_hidden" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "selling_agent_id" varchar;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "servicing_agent_id" varchar;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "organization_id" integer;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "agent_commission_rate" numeric(5, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "agent_commission_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "agent_assigned_at" timestamp;--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "policy_source" varchar(50);--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "referral_source" varchar(255);--> statement-breakpoint
ALTER TABLE "policies" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_transfers" ADD CONSTRAINT "policy_transfers_policy_id_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_transfers" ADD CONSTRAINT "policy_transfers_from_agent_id_users_id_fk" FOREIGN KEY ("from_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_transfers" ADD CONSTRAINT "policy_transfers_to_agent_id_users_id_fk" FOREIGN KEY ("to_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_transfers" ADD CONSTRAINT "policy_transfers_transferred_by_users_id_fk" FOREIGN KEY ("transferred_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_commissions_agent" ON "agent_commissions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_agent_commissions_policy" ON "agent_commissions" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_agent_commissions_status" ON "agent_commissions" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "idx_agent_commissions_date" ON "agent_commissions" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "idx_policy_transfers_policy" ON "policy_transfers" USING btree ("policy_id");--> statement-breakpoint
CREATE INDEX "idx_policy_transfers_from_agent" ON "policy_transfers" USING btree ("from_agent_id");--> statement-breakpoint
CREATE INDEX "idx_policy_transfers_to_agent" ON "policy_transfers" USING btree ("to_agent_id");--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_selling_agent_id_users_id_fk" FOREIGN KEY ("selling_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_servicing_agent_id_users_id_fk" FOREIGN KEY ("servicing_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policies" ADD CONSTRAINT "policies_organization_id_agent_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."agent_organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_policies_selling_agent" ON "policies" USING btree ("selling_agent_id");--> statement-breakpoint
CREATE INDEX "idx_policies_servicing_agent" ON "policies" USING btree ("servicing_agent_id");--> statement-breakpoint
CREATE INDEX "idx_policies_organization" ON "policies" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_users_organization_id" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_privilege_level" ON "users" USING btree ("privilege_level");--> statement-breakpoint
CREATE INDEX "idx_users_org_privilege" ON "users" USING btree ("organization_id","privilege_level");