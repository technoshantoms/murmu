ALTER TABLE `nodes` ADD `last_update_job_uuid` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `last_unavailable_check_job_uuid` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `last_authority_change_job_uuid` text;--> statement-breakpoint
ALTER TABLE `nodes` ADD `is_deleted` integer DEFAULT 0 NOT NULL;