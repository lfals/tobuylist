CREATE TABLE `priceHistory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`itemId` integer NOT NULL,
	`price` integer NOT NULL,
	`checkedAt` integer NOT NULL,
	`source` text NOT NULL,
	FOREIGN KEY (`itemId`) REFERENCES `listItems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `priceHistory_item_checked_idx` ON `priceHistory` (`itemId`,`checkedAt`);--> statement-breakpoint
ALTER TABLE `listItems` ADD `originalPrice` integer;--> statement-breakpoint
ALTER TABLE `listItems` ADD `priceCheckedAt` integer;--> statement-breakpoint
ALTER TABLE `listItems` ADD `priceCheckStatus` text;--> statement-breakpoint
ALTER TABLE `listItems` ADD `priceCheckFailures` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `listItems` SET `originalPrice` = `price` WHERE `originalPrice` IS NULL;--> statement-breakpoint
INSERT INTO `priceHistory` (`itemId`, `price`, `checkedAt`, `source`)
SELECT `id`, `price`, COALESCE(CAST(strftime('%s', `createdAt`) AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000), 'initial' FROM `listItems`;
