ALTER TABLE `games` MODIFY COLUMN `phase` enum('lobby','playing','voting','round_end','results') NOT NULL DEFAULT 'lobby';--> statement-breakpoint
ALTER TABLE `games` ADD `round` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `games` ADD `vampireKillId` int;--> statement-breakpoint
ALTER TABLE `games` ADD `voteEliminatedId` int;