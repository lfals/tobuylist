-- Remove links repetidos (mesmo item + mesma URL), mantendo o mais antigo, para o índice único poder ser criado.
DELETE FROM `itemLinks` WHERE `id` NOT IN (SELECT MIN(`id`) FROM `itemLinks` GROUP BY `itemId`, `link`);--> statement-breakpoint
CREATE UNIQUE INDEX `itemLinks_item_link_idx` ON `itemLinks` (`itemId`,`link`);
