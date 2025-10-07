CREATE TABLE `source_indexes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`label` text NOT NULL,
	`library_url` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_indexes_url_unique` ON `source_indexes` (`url`);
INSERT INTO `source_indexes` (`url`, `label`, `library_url`)
VALUES
  ('https://localhost:8080/v2/nodes', 'Production Index', 'https://library.localhost:8080/v2'),
  ('https://test-index.localhost:8080/v2/nodes', 'Test Index', 'https://test-library.localhost:8080/v2');