# 🏗️ Project Architecture

## Overview
This is a modern React + TypeScript application built with Vite, featuring a composable component architecture with clear separation of concerns.

---

## Directory Structure

```
video-call-app/
├── src/
│   ├── components/              # Reusable React components
│   │   ├── Header.tsx          # Meeting header with title and status
│   │   ├── VideoContainer.tsx  # Main video display area
│   │   ├── ControlBar.tsx      # Floating control buttons
│   │   ├── ParticipantsPanel.tsx # Participant list sidebar
│   │   ├── ChatSidebar.tsx     # Messages and participants tab panel
│   │   ├── VolumeSlider.tsx    # Volume control slider
│   │   └── Toast.tsx           # Notification toasts
│   ├── App.tsx                 # Main application component
│   ├── index.css               # Global styles with Tailwind
│   └── main.tsx                # React entry point
├── public/                     # Static assets
├── dist/                       # Production build output
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── vite.config.ts              # Vite build configuration
├── README.md                   # Main documentation
├── FEATURES.md                 # Feature list and UI details
├── ARCHITECTURE.md             # This file
└── .gitignore                  # Git ignore rules
```

---

## Component Architecture

### 1. **App.tsx** (Root Component)
Central orchestration component handling:
- Global state management (mic, camera, sharing, volume)
- Toast notification system
- Layout structure
- Event delegation

```typescript
State:
- isMicOn: boolean
- isCameraOn: boolean
- isScreenSharing: boolean
- volume: number
- toasts: Toast[]

Methods:
- addToast(message, type)
- handleMicToggle()
- handleCameraToggle()
- handleScreenShare()
- handleEndCall()
```

**Parent:** None (Root)
**Children:** Header, VideoContainer, ControlBar, ParticipantsPanel, ChatSidebar, VolumeSlider, Toast

---

### 2. **Header.tsx**
Displays meeting information and real-time status.

**Props:** None (self-contained)

**Features:**
- Animated entrance from top
- Recording indicator with pulse animation
- Participant count display
- Connection status indicator

**Key Elements:**
```tsx
- Logo badge (gradient background)
- Meeting title
- REC indicator (pulsing)
- Participant counter
- Connection status dot
```

**Styling:**
- Uses `glass-dark` class for glassmorphism
- Animated using Framer Motion
- Responsive padding

---

### 3. **VideoContainer.tsx**
Central video display area with participants grid.

**Props:**
```typescript
{
  isCameraOn: boolean      // Show camera or disabled state
  isScreenSharing: boolean // Show screen share or camera
}
```

**Features:**
- Gradient background with glassmorphism
- Participant mini-grid (top-right)
- Audio waveform visualization (bottom)
- Volume indicator animation
- Mode switching (off/camera/screen-share)

**Internal State:**
- Uses props only, no local state

**Key Animations:**
- Initial scale-up and fade-in (500ms)
- Waveform bars continuous animation
- Volume indicator pulse (1s repeat)
- Participant card hover scale (1.05x)

---

### 4. **ControlBar.tsx**
Floating button panel for call controls.

**Props:**
```typescript
{
  isMicOn: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  onMicToggle: () => void
  onCameraToggle: () => void
  onScreenShare: () => void
  onEndCall: () => void
}
```

**Buttons (Left to Right):**
1. **Microphone** - Toggle audio
2. **Camera** - Toggle video
3. **Screen Share** - Share screen
4. **Add User** - Invite participant
5. **Settings** - Open settings (placeholder)
6. **End Call** - Red danger button

**Component Pattern:**
Uses `ControlButton` sub-component for DRY code:
```typescript
<ControlButton
  icon={IconComponent}
  onClick={handler}
  label="Button Label"
  variant="default|danger|success"
  isActive={boolean}
/>
```

**Styling:**
- Glass background with hover effects
- Bottom margin from video container
- Centered layout using flexbox

---

### 5. **ParticipantsPanel.tsx**
Right-side panel displaying active participants.

**Props:** None (self-contained)

**Internal Data:**
```typescript
interface Participant {
  id: number
  name: string
  avatar: string      // Emoji
  isActive: boolean
  isMuted: boolean
}
```

**Features:**
- Scrollable vertical list
- 5 mock participants
- Active speaker highlight (green border)
- Hover animations
- Participant removal on click
- Add participant button

**Responsive:**
- Hidden on mobile (`hidden lg:flex`)
- Max height: 384px (with scroll)

---

### 6. **ChatSidebar.tsx**
Tabbed interface for messages and participants.

**Props:**
```typescript
{
  onAddToast: (message, type) => void
}
```

**Internal State:**
```typescript
activeTab: 'messages' | 'participants'
messages: Message[]
inputValue: string
```

**Features:**

#### Messages Tab
- Chat message display with avatars
- Owner vs other message styling
- Timestamped messages
- Message input with attachment button
- Send button with validation

#### Participants Tab
- List of meeting participants
- Status badges (Host, Active, Idle)
- Avatar display
- Hover effects

**Interactions:**
- Tab switching
- Message sending (Enter key or button)
- File attachment modal (placeholder)
- Toast notification on send

---

### 7. **VolumeSlider.tsx**
Vertical volume control slider.

**Props:**
```typescript
{
  volume: number              // 0-100
  onChange: (volume: number) => void
}
```

**Features:**
- Vertical orientation
- Dynamic icon (VolumeX, Volume1, Volume2)
- Visual fill indicator
- Percentage display
- Smooth drag interaction

**Responsive:**
- Hidden on mobile (`hidden md:flex`)
- Positioned left side
- Fixed width/height

---

### 8. **Toast.tsx**
Notification component for system messages.

**Props:**
```typescript
{
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}
```

**Styling:**
- Type-based colors and icons
- Glass effect background
- 3-second auto-dismiss (managed by App)
- Smooth slide-in and fade-out

**Types:**
- **Info** (Blue) - General notifications
- **Success** (Green) - Action completed
- **Warning** (Yellow) - Call ended
- **Error** (Red) - Error messages

---

## Data Flow

### State Management Strategy
Uses **React Hooks** (useState) for local component state:

```
App (Global State)
  ├── isMicOn, isCameraOn, isScreenSharing, volume
  │   ↓ (passed as props)
  ├── VideoContainer
  ├── ControlBar
  └── ParticipantsPanel
      (controlled components, read-only)
```

### Event Flow
```
User Action
  ↓
Component Click Handler
  ↓
Call parent callback (onMicToggle, etc.)
  ↓
App State Update
  ↓
Props Update
  ↓
Component Re-render
  ↓
Toast Notification
```

### Message Flow (Chat)
```
User Types Message
  ↓
Update local inputValue state
  ↓
Press Enter or Click Send
  ↓
handleSendMessage()
  ↓
Create Message object
  ↓
Add to messages array
  ↓
Clear input
  ↓
Show success toast
```

---

## Styling Architecture

### Tailwind CSS Classes
- **Utility-first approach** using Tailwind classes
- **Custom classes**: `glass`, `glass-dark` (defined in index.css)
- **Responsive prefixes**: `md:`, `lg:` for breakpoints

### Global Styles (index.css)
```css
@tailwind base;          /* Reset and base styles */
@tailwind components;    /* Reusable component classes */
@tailwind utilities;     /* Utility classes */

/* Custom utilities */
.glass                   /* Light glassmorphism */
.glass-dark              /* Dark glassmorphism */
.transition-smooth       /* Smooth transitions */
```

### Glassmorphism Effect
```css
.glass {
  @apply backdrop-blur-md bg-white/10 border border-white/20;
}

.glass-dark {
  @apply backdrop-blur-md bg-black/40 border border-white/10;
}
```

### Animation Classes
- Framer Motion for JavaScript animations
- Tailwind animations for CSS animations
- Custom @keyframes defined in tailwind.config.ts

---

## TypeScript Interfaces

### Custom Types
```typescript
// Toast notification
interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

// Participant data
interface Participant {
  id: number
  name: string
  avatar: string
  isActive: boolean
  isMuted: boolean
}

// Chat message
interface Message {
  id: number
  author: string
  avatar: string
  content: string
  timestamp: string
  isOwn: boolean
}

// Component props
interface ControlBarProps {
  isMicOn: boolean
  isCameraOn: boolean
  isScreenSharing: boolean
  onMicToggle: () => void
  onCameraToggle: () => void
  onScreenShare: () => void
  onEndCall: () => void
}
```

---

## Animation Strategy

### Framer Motion Usage
- **Initial State**: Starting animation state
- **Animate State**: End animation state
- **Transition**: Duration, delay, easing
- **Variants**: Reusable animation configurations

### Common Animations
```typescript
// Entrance animations
initial={{ opacity: 0, y: -100 }}
animate={{ opacity: 1, y: 0 }}

// Hover effects
whileHover={{ scale: 1.1 }}
whileTap={{ scale: 0.95 }}

// Continuous animations
animate={{ height: [8, 30, 8] }}
transition={{ repeat: Infinity, duration: 0.5 }}
```

### Staggered Animation
```typescript
// Used in Participants Panel
initial={{ x: 100, opacity: 0 }}
animate={{ x: 0, opacity: 1 }}
transition={{ delay: index * 0.1 }}
```

---

## Performance Considerations

### Optimization Techniques
1. **Component Memoization**: React.memo for heavy components
2. **Event Delegation**: Bubbling for efficient event handling
3. **CSS Optimization**: Tailwind purges unused styles in production
4. **Image Optimization**: SVG icons via Lucide (no image files)
5. **Code Splitting**: Lazy loading for future features
6. **Animation Optimization**: GPU-accelerated transforms

### Bundle Size
- Production build: ~271KB (uncompressed)
- Gzipped: ~87KB
- Main dependencies:
  - React: ~42KB
  - Framer Motion: ~55KB
  - Tailwind: ~20KB

---

## Extension Guide

### Adding a New Component

1. **Create component file**: `src/components/NewFeature.tsx`
2. **Define interfaces**: Props, state types
3. **Implement component**: Functional component with hooks
4. **Add animations**: Framer Motion wrappers
5. **Style with Tailwind**: Utility classes
6. **Export**: Default export

### Example:
```typescript
// src/components/NewFeature.tsx
import { motion } from 'framer-motion'
import { SomeIcon } from 'lucide-react'

interface NewFeatureProps {
  isEnabled: boolean
  onToggle: () => void
}

export default function NewFeature({ isEnabled, onToggle }: NewFeatureProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-xl p-4"
    >
      <button onClick={onToggle} className="flex items-center gap-2">
        <SomeIcon className="w-5 h-5" />
        {isEnabled ? 'On' : 'Off'}
      </button>
    </motion.div>
  )
}
```

### Integrating into App
```typescript
// Import in App.tsx
import NewFeature from './components/NewFeature'

// Add to render
<NewFeature
  isEnabled={isFeatureEnabled}
  onToggle={toggleFeature}
/>
```

---

## Testing Strategy

### Unit Tests (Future)
```typescript
// Would test individual components
@testing-library/react
jest
```

### E2E Tests (Future)
```typescript
// Would test user flows
cypress
```

### Manual Testing
Currently manual testing through dev server:
- Browse to http://localhost:5173
- Interact with UI elements
- Check animations in DevTools
- Verify responsive design

---

## Build & Deployment

### Development
```bash
npm run dev      # Start dev server
```

### Production
```bash
npm run build    # Generate dist folder
npm run preview  # Preview production build
```

### Deployment Options
- **Vercel**: Direct GitHub integration
- **Netlify**: Drag & drop or Git push
- **AWS S3 + CloudFront**: Manual upload
- **GitHub Pages**: With build workflow
- **Docker**: Container deployment

### Build Optimization
```bash
npm run build
# Creates optimized production build
# - TypeScript compilation
# - CSS minification
# - JavaScript bundling
# - Asset optimization
```

---

## Dependencies Overview

### Core
- **react** (18.2.0) - UI framework
- **react-dom** (18.2.0) - DOM rendering

### Styling
- **tailwindcss** (3.3.6) - Utility CSS
- **postcss** (8.4.31) - CSS processing
- **autoprefixer** (10.4.16) - Vendor prefixes

### Animation
- **framer-motion** (10.16.16) - Animation library

### Icons
- **lucide-react** (0.378.0) - Icon library

### Build Tools
- **vite** (5.0.8) - Build tool
- **@vitejs/plugin-react** (4.2.0) - React plugin
- **typescript** (5.2.2) - Language

### Utilities
- **clsx** (2.1.0) - Class name utility
- **tailwind-merge** (2.2.1) - Merge Tailwind classes

---

## Debugging

### Browser DevTools
- React DevTools for component inspection
- Framer Motion DevTools for animation preview
- Network tab for performance analysis

### Console Logging
```typescript
// Add in components for debugging
useEffect(() => {
  console.log('State changed:', { isMicOn, isCameraOn })
}, [isMicOn, isCameraOn])
```

### Hot Module Replacement (HMR)
- Auto-reload on file save during development
- Preserves component state
- Shows error overlay on build errors

---

## Version Management

### Current Versions
- React: 18.2.0
- TypeScript: 5.2.2
- Vite: 5.0.8
- Tailwind: 3.3.6

### Updating Dependencies
```bash
npm outdated      # Check for updates
npm update        # Update to compatible versions
npm audit fix     # Fix security vulnerabilities
```

---

## Future Architecture Improvements

1. **State Management**
   - Consider Context API for complex state
   - Redux/Zustand for large-scale apps
   - Jotai for atomic state management

2. **Component Library**
   - Extract reusable patterns
   - Create component documentation (Storybook)
   - Design system tokens

3. **Testing**
   - Unit tests for components
   - Integration tests for flows
   - E2E tests for user scenarios

4. **Backend Integration**
   - API layer for real data
   - WebSocket for real-time updates
   - Authentication/authorization

5. **Performance**
   - Code splitting
   - Lazy loading images
   - Virtual scrolling for large lists
