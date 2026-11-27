CREATE TABLE `itemLinks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itemId` integer NOT NULL,
	`link` text NOT NULL,
	`store` text,
	`price` integer NOT NULL,
	`createdAt` integer DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`itemId`) REFERENCES `listItems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `itemLinks` (`itemId`, `link`, `store`, `price`)
SELECT `id`, `link`, `store`, `price` FROM `listItems` WHERE `link` IS NOT NULL AND `link` != '';
