CREATE TABLE `material_levels` (
	`name` text PRIMARY KEY NOT NULL,
	`base_role` text NOT NULL,
	`rights` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `material_user_profiles` (
	`username` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`rights` text NOT NULL,
	`details` text NOT NULL
);
