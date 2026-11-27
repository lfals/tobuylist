CREATE TABLE IF NOT EXISTS `listItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listId` text NOT NULL,
	`name` text NOT NULL,
	`store` text,
	`link` text,
	`price` integer NOT NULL,
	`quantity` integer NOT NULL,
	`imageUrl` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`listId`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`userId` text NOT NULL,
	`public` integer DEFAULT 0 NOT NULL,
	`shared` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sharedLists` (
	`id` text PRIMARY KEY NOT NULL,
	`listId` text NOT NULL,
	`userId` text NOT NULL
);
