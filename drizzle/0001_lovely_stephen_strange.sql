CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`hostUserId` int NOT NULL,
	`phase` enum('lobby','playing','voting','results') NOT NULL DEFAULT 'lobby',
	`result` enum('vampire_wins','villagers_win'),
	`timerEndsAt` bigint,
	`votingEndsAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int NOT NULL,
	`userId` int,
	`sessionToken` varchar(64) NOT NULL,
	`displayName` varchar(32) NOT NULL,
	`role` varchar(32),
	`isAlive` boolean NOT NULL DEFAULT true,
	`isHost` boolean NOT NULL DEFAULT false,
	`votedForId` int,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
