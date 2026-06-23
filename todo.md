# Vampire High - Project TODO

## Core Infrastructure
- [x] Database schema: games table, players table
- [x] Shared types and constants for roles, game states, phases
- [x] Server-side game logic: create lobby, join lobby, start game
- [x] Role assignment logic: random assignment with exactly 1 Vampire
- [x] 6-character game code generation

## Lobby & Joining
- [x] Host creates game lobby (authenticated)
- [x] Game code display + QR code generation
- [x] Players join via game code (no auth required)
- [x] Players choose display name before entering lobby
- [x] Lobby shows connected players in real-time (polling)
- [x] Host controls game start
- [x] Enforce 4-10 player count before start

## Gameplay
- [x] Secret role card reveal on game start
- [x] Role card shows role name + placeholder ability (non-Vampire)
- [x] Vampire role card shows "Vampire" with no ability
- [x] 5-minute countdown discussion timer visible to all
- [x] Timer synced across all players via server timestamp

## Voting Phase
- [x] Voting phase begins automatically when timer expires
- [x] Dumb Hoe and Dumb Jock cannot vote
- [x] Players nominate a suspect
- [x] Majority vote eliminates targeted player
- [x] Eliminated player's role is revealed

## Win Conditions
- [x] Villagers win if Vampire is eliminated
- [x] Vampire wins if timer expires without elimination
- [x] Game over screen with result

## UI / Design
- [x] Dark high-school horror theme
- [x] Mobile-first responsive design
- [x] Elegant, polished visual style
- [x] Home page with create/join options
- [x] Lobby waiting room UI
- [x] Role card reveal animation
- [x] Discussion phase UI with timer
- [x] Voting phase UI
- [x] Game results screen

## Bugs
- [x] QR code / join link not accessible in preview mode — added clear preview warning, hides QR in preview, shows code prominently
- [x] Ensure QR/join link works end-to-end after publishing (uses window.location.origin — will resolve correctly on published domain)

## Future / Deferred (by design)
- [ ] Host-editable role abilities (deferred - not in current scope)
- [x] Active ability execution in-app — all abilities now executable with server-side logic + frontend UI
- [x] Mathlete ability — view unused roles button implemented (30s timer)
- [x] Principal ability — vote counts as 2 (server-side weighted tally)
- [x] Dumb Hoe / Dumb Jock — can't initiate votes (server + UI enforced)
- [x] Multi-round gameplay — fully implemented

## UI Updates (User Request)
- [x] Change title font to varsity/collegiate style (Graduate from Google Fonts)
- [x] Generate vampire illustration to replace red skull icon
- [x] Update tagline to: "A social deduction game where blood and betrayal lines the hallways of high school."

## Major Game Mechanics Overhaul
- [x] Remove Janitor, Exchange Student, Drug Dealer roles
- [x] Add Principal role (vote counts as 2)
- [x] Add School Counselor role (force pull player to separate room for 1:00)
- [x] Update all role abilities to final versions
- [x] Implement multi-round gameplay (rounds continue until win condition)
- [x] Vampire kill mechanic: if Vampire survives a round, their vote target dies
- [x] Secret voting: no one can see another player's vote
- [x] Principal's vote counts as 2 in tally
- [x] Win condition: Villagers win if Vampire eliminated by majority vote
- [x] Win condition: Vampire wins when only 1 other player remains
- [x] Everyone can vote (including Vampire), Dumb Hoe/Dumb Jock can vote but can't initiate
- [x] Update frontend for multi-round flow, round transitions, kill announcements
- [x] Update tests for new game logic (43 tests passing)

## New Feature Request
- [x] Add a role reference panel accessible during gameplay showing all roles and their abilities (bottom sheet with "Roles" button in header)

## Rule Updates (User Request)
- [x] Change "Villagers win" to "The High School wins" everywhere (app + PDF)
- [x] Add core rule: No one is allowed to reveal their role — must role-play only (shown in-game + PDF)
- [x] Update the printable rules PDF with both changes

## Active Abilities Implementation (User Request)
- [x] Homecoming Queen: select player → reveals if Vampire or not (once per game)
- [x] Bully: select player → blocks them from initiating vote this round (resets per round)
- [x] School Shooter: select player → kills them + yourself; if target is Vampire, High School wins (once per game)
- [x] Mathlete: view unused roles for 30 seconds (once per game)
- [x] Teacher: select player → detained/muted for 60 seconds (resets per round)
- [x] Dumb Hoe: select player → privately see their role (resets per round)
- [x] Dumb Jock: select player → that player cannot vote this round (resets per round)
- [x] School Counselor: select player → both pulled away for 60 seconds (resets per round)
- [x] Principal: vote counts as 2 (passive, server-side)
- [x] Update Dumb Hoe and Dumb Jock to FULLY block voting (not just can't initiate)
- [x] Track ability usage per game and per round (ability_usages table)
- [x] Build interactive ability UI buttons for each role during discussion phase
- [x] Update rules PDF with active abilities, updated voting rules (Dumb Hoe/Jock can't vote), and limit column

## Voting Rule Change: Unanimity Required (User Request)
- [x] Change vote processing: non-vampire voters must be UNANIMOUS to eliminate someone
- [x] If not unanimous, the Vampire's vote target is killed instead
- [x] Update frontend voting UI text to explain unanimity rule
- [x] Update tests for new voting logic (70 tests passing)
- [x] Update rules PDF with unanimity rule

## Vampire Ability & Timer Changes (User Request)
- [x] Allow Vampire to use ANY role ability (not just Vampire's no-ability)
- [x] Update frontend to show all 9 abilities for Vampire during discussion phase
- [x] Change discussion timer from 5 minutes to 3 minutes per round
- [x] Update tests for new timer and Vampire ability logic
- [x] Update rules PDF with 3-minute timer and Vampire ability rule

## Audio & UI Updates (User Request - Session 2)
- [x] Update home screen tagline to say "3 minute rounds" instead of "5 minute rounds"
- [x] Generate scary/atmospheric music for discussion phase (night phase)
- [x] Generate suspenseful music for voting phase
- [x] Implement audio system in GamePlay component with phase-based music switching
- [x] Add background music throughout gameplay
- [x] Test audio playback and ensure smooth transitions between phases
- [x] Upload audio files to web storage with proper URLs
- [x] Add sound toggle button in game header with mute/unmute icons
- [x] Handle browser autoplay restrictions with sound toggle UI

## Bugs - Session 3
- [x] Fix audio loading error when game starts (CORS or 404 issue with audio files) — Fixed by using useRef, adding user interaction requirement, and proper error handling
- [x] Fix React error #310 "Rendered more hooks than during the previous render" — Root cause: useCountdown hook was called inside JSX IIFE (conditionally rendered), violating React rules of hooks. Fixed by moving useCountdown calls to top level of component.

## Audio Reimplementation (Session 4)
- [x] Create robust useGameAudio hook that handles browser autoplay restrictions safely
- [x] Integrate audio into GamePlay without causing production errors
- [x] Add sound toggle UI in game header
- [x] Verify no errors in production build

## Role Changes (Session 5)
- [x] Vampire: Block kill/elimination abilities (cannot use Gossip Queen's ability)
- [x] Rename "Dumb Hoe" to "Dumb Cheerleader" — can't vote, can pick one player to see their role (dated everyone)
- [x] Replace "School Shooter" with "Gossip Queen" — can eliminate one player but is also removed from game after using ability (one-time use)
- [x] Update shared types/constants with new role names, abilities, descriptions
- [x] Update server game logic for new abilities and restrictions
- [x] Update frontend UI with new role names and descriptions
- [x] Update tests for new role mechanics

## Audio Improvements (Session 6)
- [x] Fix background music to loop continuously instead of stopping when audio file ends
- [x] Generate scary sound effect for when vampire kills someone
- [x] Generate school cheering sound effect for when vampire is eliminated
- [x] Integrate kill sound into round_end phase when vampire strikes
- [x] Integrate cheering sound into results phase when vampire is caught

## Homecoming Queen Ability Change (Session 7)
- [x] Change Homecoming Queen ability from "force reveal" to "fast-forward discussion to voting" (once per game)
- [x] Update shared types (ability name, description, limits)
- [x] Update server game logic to implement fast-forward mechanic
- [x] Update frontend UI for new ability button/description
- [x] Update tests
- [x] Regenerate one-page rules PDF

## Bully Ability Change (Session 8)
- [x] Change Bully ability from "block vote" to "silence everyone for 30s + force one player to give their case"
- [x] Update shared types (ability name: bully_spotlight, description)
- [x] Update server logic for new Bully mechanic (detains all except target for 30s)
- [x] Update frontend UI (target picker for who gives their case)
- [x] Update tests
- [x] Regenerate one-page rules PDF

## Spotlight Banner UI (Session 9)
- [x] Add visual spotlight banner to GamePlay component when Bully's spotlight ability is active
- [x] Display which player is "giving their case" during the 30-second silence
- [x] Show countdown timer for the spotlight duration
- [x] Highlight the target player in the UI
- [x] Ensure banner displays only during discussion phase when spotlight is active
- [x] Test spotlight banner with all game states
- [x] Verify rules PDF includes updated Bully ability description

## Session 9 Summary
Completed spotlight banner feature for Bully's new ability. The banner displays when the Bully uses their spotlight ability, showing which player is giving their case while others are silenced for 30 seconds. Includes smooth countdown timer, yellow/gold styling with pulsing icons, and proper integration with existing ability tracking. All 70 tests passing, production build clean, ready for deployment.

## Character Portraits Integration (Session 10)
- [x] Upload 10 character portrait images to web storage
- [x] Create role-to-portrait mapping in shared types
- [x] Update role card UI to display character portrait
- [x] Display portrait during role reveal on game start
- [x] Display portrait in role reference panel
- [x] Test portrait display across all roles
- [x] Verify portraits display correctly on mobile


## Session 10 Summary
Completed character portrait integration for all 10 roles. Uploaded high-quality character artwork to web storage and created role-to-portrait mappings. Updated GamePlay component to display full-size portraits in the role reveal card and thumbnail portraits in the role reference panel. Added comprehensive portrait tests verifying all roles map to valid storage URLs. All 75 tests passing (5 new portrait tests + 70 existing), production build clean, mobile-responsive design with fixed image dimensions.


## Bug Fixes (Session 11)
- [x] Fix Mathlete voting restriction persisting across rounds (detention status now resets each round)
- [x] Fix game end message from "Town Wins" to "The High School Wins" (fixed Results.tsx winner derivation)
- [x] Verify vampire win condition when only 2 players remain (correct: vampire wins with 2 players left)
- [x] Add regression tests for multi-round voting and win conditions (6 new tests)

## Session 11 Summary
Fixed two critical bugs and added regression tests. Bug 1: Mathlete couldn't vote in round 2 because detention status wasn't being cleared between rounds - fixed by updating resetVotes() to clear detainedUntil field. Bug 2: Results page showed "The High School Wins!" even when vampire won - fixed by correcting winner derivation from result enum ("vampire_wins") instead of accessing non-existent result.winner property. Added 6 regression tests covering multi-round voting, detention clearing, and win condition logic. All 81 tests passing (6 new regression tests + 75 existing), production build clean, ready for deployment.


## Rules & Documentation (Session 12)
- [x] Update rules PDF to clarify "YOU MUST ROLEPLAY YOUR CHARACTER"
- [x] Add "NEVER STATE YOUR ROLE" rule to core rules section
- [x] Add roleplay emphasis note in rules PDF


## SEO Optimization (Session 13)
- [x] Update HTML meta tags with SEO-friendly titles and descriptions
- [x] Add JSON-LD structured data for game and organization
- [x] Create sitemap.xml and robots.txt
- [x] Optimize Open Graph and Twitter Card meta tags
- [x] Add canonical URLs
- [x] Verify SEO implementation

## Session 13 Summary
Implemented comprehensive SEO optimization for playvampirehigh.com. Added SEO-friendly meta tags (title, description, keywords), Open Graph tags for social sharing, Twitter Card tags, and JSON-LD structured data (Game and Organization schemas). Created sitemap.xml and robots.txt for search engine crawling. Added canonical URLs and hreflang tags. Removed all placeholder data (fake ratings, non-existent social links, missing image assets) to ensure production-ready SEO markup. Sitemap includes only the home page (dynamic game routes are not crawlable). All 81 tests passing, production build clean, ready for search engine indexing.


## Language Support (Session 14)
- [x] Create language context and translations for all UI text
- [x] Add language toggle button to navigation/header (with flag icons: 🇺🇸 EN / 🇪🇸 ES)
- [x] Translate all game pages and components to Spanish
- [x] Persist language preference to localStorage
- [x] Test language switching and verify all text translates correctly
- [x] Add language toggle to Lobby page with full translations

## Session 14 Summary
Implemented full language support for American English and Spain Spanish. Created LanguageContext with comprehensive translations for all UI text. Added language toggle button with flag icons (🇺🇸 EN / 🇪🇸 ES) positioned in top-right corner on Home, JoinGame, and Lobby pages. Translated all Lobby page text (Waiting Room, Game Code, player list, etc.). Language preference persists to localStorage and applies across all pages. All 81 tests passing, production build clean, ready for deployment.


## Sound Effects (Session 15)
- [x] Generate sound effects for each of the 9 abilities
- [x] Upload sound effects to web storage
- [x] Create sound effect mapping and audio utility
- [x] Integrate sound effects into GamePlay component ability triggers
- [x] Test sound effects and verify all abilities trigger correctly


## Session 15 Summary
Implemented comprehensive sound effects system for all 8 ability types. Generated unique audio files for each ability (homecoming_fastforward, bully_spotlight, gossip_queen_destroy, mathlete_view, teacher_detain, cheerleader_peek, dumb_jock_intimidate, school_counselor_pull). Uploaded all 9 sound effects to web storage with unique identifiers. Created sound effect mapping constant (ABILITY_SOUND_EFFECTS) in shared/soundEffects.ts with correct ability name keys matching AbilityName type. Built useAbilitySound hook to handle audio playback with error handling and cleanup. Integrated sound effects into GamePlay component's ability execution flow. All 81 tests passing, production build clean, ready for deployment.

## Session 16 - Principal Ability Rework & Vampire Ability Reset & Bug Fix
- [x] Debug "no ability" screen appearing after 3 rounds (Root cause: Vampire abilities were once_per_game, now fixed to reset each round)
- [x] Change Principal's ability from vote-counts-as-2 to administrative leave (block target's ability for a round)
- [x] Update Vampire's ability usage to reset each round (can use any ability each round, except gossip_queen_destroy)
- [x] Update all UI text and descriptions for Principal's new ability
- [x] Update all tests for new Principal and Vampire ability mechanics
- [x] Verify all 81+ tests pass and production build succeeds

## Session 16 Summary
Fixed three critical issues: (1) "No ability" screen bug - Vampire abilities now reset each round instead of once_per_game; (2) Principal's new active ability - changed from passive vote-counts-as-2 to "administrative leave" which blocks target's ability for the round; (3) Database & API updates - added abilityBlockedUntil column, updated ability tracking logic, exposed blocked status in responses. UI shows red warning when ability is blocked. All 81 tests passing, production build clean.

## Session 17 - Bug Fix: Second Player Join Error
- [x] Identified root cause: JSX formatting issues in Lobby.tsx causing unintended text nodes in DOM
- [x] Fixed newline formatting in three locations (copy join link button, "need more players" span, "you" indicator)
- [x] Verified production build succeeds
- [x] All 81 tests passing
- [x] Ready for deployment

The issue was caused by improper indentation/newlines in JSX that created unintended text nodes, causing React DOM reconciliation errors when the second player joined and the player list re-rendered. Fixed by properly formatting the JSX to remove extraneous whitespace nodes.


## Session 18 - Mobile Responsiveness Improvements
- [x] Audit current mobile experience and identify responsiveness issues
- [x] Improve touch targets and button sizes for mobile (min 56px on mobile)
- [x] Enhance keyboard navigation and accessibility (Tab, Enter, Escape keys)
- [x] Optimize layouts for small screens (mobile-first refinements)
- [x] Test all changes on various mobile devices
- [x] Verify no regressions and all 81+ tests pass

### Improvements Made:
- **GamePlay Component**: Increased player selection buttons from py-3 to py-4 (56px min height on mobile), avatar from 8x8 to 10x10 on mobile, text size from text-base to text-sm on mobile
- **Home Page**: Reduced vampire illustration from 36x36 to 32x32 on mobile, title from text-5xl to text-4xl, subtitle text-xs on mobile
- **Lobby Page**: Player list items now min-h-12 on mobile (56px), avatars 10x10 on mobile, text-sm on mobile
- **JoinGame Page**: Title text-3xl on mobile, input heights h-14 on mobile, button text-base on mobile
- **All Pages**: Added responsive text sizing (text-sm sm:text-base), responsive button heights (h-14 sm:h-12), responsive spacing
- **Touch Targets**: All interactive elements now meet or exceed 44x44px minimum on mobile (most are 56px)
- **Responsive Typography**: Adjusted font sizes across all pages for better mobile readability
- **All 81 tests passing**, production build clean


## Session 19 - React Native + Expo Conversion for iOS App Store
- [ ] Set up new React Native + Expo project structure
- [ ] Convert web UI components to React Native components (Home, JoinGame, Lobby, GamePlay)
- [ ] Implement React Navigation for mobile navigation flow
- [ ] Connect to existing Node.js backend via API (tRPC or REST)
- [ ] Adapt styling and theming for mobile (NativeWind or Tailwind CSS)
- [ ] Implement audio system for React Native (Expo Audio)
- [ ] Test all features on iOS simulator
- [ ] Configure Expo for iOS App Store submission
- [ ] Create app.json with app metadata and iOS configuration
- [ ] Build and test on physical iOS device
- [ ] Prepare for App Store submission (screenshots, description, etc.)
