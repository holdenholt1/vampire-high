-- Guest-mode migration: allow games created by a guest host (no platform user).
-- Makes games.hostUserId nullable. Safe to run once on the existing schema.
ALTER TABLE `games` MODIFY `hostUserId` int NULL;
