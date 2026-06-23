# Vampire High - React Native + Expo Conversion Guide

## Overview
This document provides Claude with everything needed to convert Vampire High from a web app to a React Native + Expo app for iOS App Store deployment.

## Current Project Structure

### Backend (Node.js + Express + tRPC)
- **Location**: `server/` directory
- **Key Files**:
  - `server/routers.ts` - All game logic and tRPC procedures
  - `server/db.ts` - Database helpers
  - `drizzle/schema.ts` - Database schema
  - `server/_core/` - Core infrastructure (OAuth, context, etc.)

### Frontend (React + Tailwind)
- **Location**: `client/src/` directory
- **Key Pages**:
  - `client/src/pages/Home.tsx` - Landing page
  - `client/src/pages/JoinGame.tsx` - Join game flow
  - `client/src/pages/Lobby.tsx` - Waiting room
  - `client/src/pages/GamePlay.tsx` - Main game interface
- **Components**: `client/src/components/` - Reusable UI components
- **Styling**: Tailwind CSS + custom CSS variables

### Shared Code
- **Location**: `shared/` directory
- **Key Files**:
  - `shared/types.ts` - All TypeScript types and constants
  - `shared/const.ts` - Shared constants
  - `shared/soundEffects.ts` - Sound effect mappings

## Game Features to Preserve

### Core Mechanics
- 10 different roles (Vampire, Homecoming Queen, Bully, Gossip Queen, Mathlete, Teacher, Dumb Cheerleader, Dumb Jock, School Counselor, Principal)
- 3-minute discussion rounds
- Secret voting with unanimity requirement
- Active abilities for each role
- Multi-round gameplay until win condition
- Sound effects for ability usage
- Background music for discussion/voting phases

### UI Features
- Dark high-school horror theme
- Role reveal card with character portrait
- Role reference panel (bottom sheet)
- Ability picker (bottom sheet)
- Voting UI with player selection
- Game results screen
- Language support (English + Spanish)
- Sound toggle button

### Audio System
- Discussion phase background music
- Voting phase background music
- Ability-specific sound effects (8 different sounds)
- Vampire kill sound
- High school cheering sound
- Sound toggle UI

## Conversion Strategy

### Phase 1: Project Setup
1. Create new Expo project with TypeScript
2. Install required dependencies:
   - `react-native`
   - `expo`
   - `@react-navigation/native` (navigation)
   - `@react-navigation/bottom-tabs` or `@react-navigation/native-stack`
   - `nativewind` (Tailwind CSS for React Native)
   - `expo-av` (audio playback)
   - `expo-font` (custom fonts)
   - `axios` or `@trpc/client` (API communication)
   - `zustand` or `react-query` (state management)

### Phase 2: UI Component Conversion
Convert web components to React Native:

**Web → React Native Mapping**:
- `<div>` → `<View>`
- `<button>` → `<Pressable>` or `<TouchableOpacity>`
- `<input>` → `<TextInput>`
- `<img>` → `<Image>`
- `<p>` → `<Text>`
- Tailwind CSS → NativeWind (Tailwind for React Native)
- `shadcn/ui` components → React Native equivalents

**Key Components to Convert**:
1. `Home.tsx` - Landing page with Host/Join buttons
2. `JoinGame.tsx` - Game code input and name entry
3. `Lobby.tsx` - Player list and start game button
4. `GamePlay.tsx` - Main game interface (largest component)
5. `Results.tsx` - Game results screen

### Phase 3: Navigation Setup
Use React Navigation for mobile navigation:
```typescript
// Stack Navigator for main flow
// Home → JoinGame → Lobby → GamePlay → Results
```

### Phase 4: API Integration
- Keep existing Node.js backend running
- Use `@trpc/client` or `axios` to communicate with backend
- All game logic stays on server
- Frontend only handles UI and user interactions

### Phase 5: Styling
- Use NativeWind (Tailwind CSS for React Native)
- Preserve dark theme and color scheme
- Adapt layouts for mobile screens
- Ensure touch targets are 44x44pt minimum

### Phase 6: Audio System
- Use `expo-av` for audio playback
- Implement audio toggle button
- Handle background music loops
- Preload critical audio files

### Phase 7: Testing & Deployment
- Test on iOS simulator
- Test on physical iOS device
- Configure Expo for App Store submission
- Create app.json with metadata
- Prepare screenshots and app description

## Key Files to Reference

### Types & Constants
```
shared/types.ts - All game types, roles, abilities, constants
shared/const.ts - Shared constants
shared/soundEffects.ts - Sound effect URLs and mappings
```

### Game Logic (Keep on Backend)
```
server/routers.ts - All tRPC procedures for game logic
server/db.ts - Database operations
drizzle/schema.ts - Database schema
```

### Frontend Pages to Convert
```
client/src/pages/Home.tsx
client/src/pages/JoinGame.tsx
client/src/pages/Lobby.tsx
client/src/pages/GamePlay.tsx
client/src/pages/Results.tsx (if exists)
```

### Styling
```
client/src/index.css - Global styles and CSS variables
components.json - shadcn/ui configuration (reference only)
```

## Important Considerations

### 1. Backend Connection
- The Node.js backend must remain running and accessible
- Frontend will communicate via HTTP/WebSocket
- All game logic stays server-side
- Frontend is purely UI layer

### 2. Authentication
- Current: Manus OAuth (web-based)
- For iOS: May need to implement native OAuth or alternative auth
- Consider: Apple Sign-In, custom token-based auth, or guest mode

### 3. Storage
- Audio files: Already uploaded to web storage (use same URLs)
- Character portraits: Already uploaded to web storage (use same URLs)
- Game data: Stored in database (backend handles)
- Local storage: Use `AsyncStorage` for preferences (language, sound toggle)

### 4. Permissions
- Audio: Request microphone permission if needed
- Camera: Not needed for current features
- Network: Required for backend communication

### 5. App Store Requirements
- Privacy Policy URL
- Terms of Service URL
- App icon (1024x1024)
- Screenshots (5-8 screenshots showing gameplay)
- App description and keywords
- Age rating (likely 12+ or 17+)
- Category: Games

## Development Workflow

1. **Setup**: Create Expo project and install dependencies
2. **Convert**: Convert web components to React Native
3. **Integrate**: Connect to backend API
4. **Style**: Apply NativeWind and custom styling
5. **Audio**: Implement audio system
6. **Test**: Test on simulator and physical device
7. **Deploy**: Configure for App Store submission

## Testing Checklist

- [ ] All pages render correctly on iOS
- [ ] Navigation works smoothly
- [ ] Game creation works
- [ ] Joining games works
- [ ] Lobby displays players correctly
- [ ] Game phases transition properly
- [ ] Abilities execute correctly
- [ ] Voting works as expected
- [ ] Results display correctly
- [ ] Audio plays without errors
- [ ] Sound toggle works
- [ ] Language switching works
- [ ] Responsive layout on different screen sizes
- [ ] Touch targets are adequate
- [ ] No console errors or warnings

## App Store Submission

### Before Submission
1. Create Apple Developer account
2. Create App ID in Apple Developer Portal
3. Generate provisioning profiles and certificates
4. Create app listing in App Store Connect

### Expo Build Command
```bash
eas build --platform ios
```

### App Store Connect
1. Upload build via Xcode or Transporter
2. Add app screenshots
3. Add app description and keywords
4. Set age rating
5. Add privacy policy and terms
6. Submit for review

## Resources

- React Native Docs: https://reactnative.dev/
- Expo Docs: https://docs.expo.dev/
- NativeWind Docs: https://www.nativewind.dev/
- React Navigation: https://reactnavigation.org/
- Expo Audio: https://docs.expo.dev/versions/latest/sdk/audio/

## Questions for Claude

When converting, please clarify:
1. Should we implement native iOS Sign-In or keep current auth?
2. Should we create a separate native app or use Expo Go for testing?
3. Any specific design changes needed for mobile?
4. Should we add any native features (push notifications, etc.)?
5. What's the target iOS version (minimum deployment target)?

---

**Current Web App Status**: Fully functional, all features working, 81 tests passing, production-ready.

**Conversion Goal**: Create iOS app that mirrors web app functionality while being optimized for mobile.

**Timeline**: Depends on complexity of UI conversion and testing.
