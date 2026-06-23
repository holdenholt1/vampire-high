CREATE TABLE `ability_usages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`playerId` int NOT NULL,
	`ability` varchar(32) NOT NULL,
	`targetPlayerId` int,
	`round` int NOT NULL,
	`result` text,
	`usedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ability_usages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `games` MODIFY COLUMN `result` enum('vampire_wins','highschool_wins');--> statement-breakpoint
ALTER TABLE `players` ADD `detainedUntil` bigint;--> statement-breakpoint
ALTER TABLE `players` ADD `voteBlocked` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `players` ADD `initiateBlocked` boolean DEFAULT false NOT NULL;