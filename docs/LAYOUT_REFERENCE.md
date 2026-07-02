# Responsive Video UI - Quick Reference Guide

## Layout Structure

### Desktop (1280px+)
```
┌──────────────────────────────────────────────────────────────┐
│ 📱 Design Critique Meeting   [00:15]  5 participants  🟢 Connected │
├──────┬────────────────────────────┬────────────────────────┤
│      │                            │   👥 Participants      │
│  🏠   │    16:9 Video Container    │   ┌─────────────────┐ │
│  📅   │    (Centered, Max 1400px)  │   │  👨 You  You    │ │
│  👥   │                            │   │  👩 Sarah       │ │
│  ⚙️   │    [ 🔇  📷  💻  ➕  ⚙️ ] [ ☎️ ] │  👨 Alex        │ │
│      │                            │   │  👩 Emma        │ │
│      │                            │   │  👨 James       │ │
│      │                            │   └─────────────────┘ │
│      │                            │                       │
│      │                            │   💬 Messages (3)     │
│      │                            │   ┌─────────────────┐ │
│      │                            │   │ Sarah: Great!   │ │
│      │                            │   │       You: Thx! │ │
│      │                            │   │ Alex: +1        │ │
│      │                            │   │                 │ │
│      │                            │   │[Type message..] │ │
│      │                            │   └─────────────────┘ │
└──────┴────────────────────────────┴────────────────────────┘
```

### Tablet (768px-1024px)
```
┌──────────────────────────────────────────┐
│ 📱 Design Critique Meeting  [00:15] ... │
├──────────────────────────────────────────┤
│                                          │
│   16:9 Video Container                  │
│   (Responsive width)                     │
│                                          │
│   [ 🔇  📷  💻  ➕  ⚙️ ] [ ☎️ ]         │
│                                          │
├──────────────────────────────────────────┤
│ 👥 Participants    💬 Messages           │
│ [👨][👩][👨]       [Your msg]           │
│ [👩][👨]          [Sarah reply]         │
│                   [Type msg...]         │
└──────────────────────────────────────────┘
```

### Mobile (< 640px)
```
┌──────────────────────────┐
│ 📱 Design Critique... [00│
├──────────────────────────┤
│                          │
│   Video Container        │
│   (Full width)           │
│                          │
│   [ 🔇 📷 💻 ] [ ☎️ ]   │
│                          │
├──────────────────────────┤
│ 💬 Messages              │
│ Sarah: Great pres!      │
│ You: Thanks!           │
│                         │
│ [Type message........ ] │
│ [⭐ 😀 👍 🎉]          │
└──────────────────────────┘
```

---

## Component Alignment Reference

### Header
- **Position:** Fixed at top
- **Width:** Full screen
- **Content:** Left (meeting title, icon) | Right (timer, stats, connection)
- **Spacing:** `px-6 py-4` with centered max-width

### Left Navigation Sidebar
- **Visible:** Desktop only (`xl:flex`)
- **Width:** 80px fixed
- **Items:** Home, Calendar, Contacts, Settings/Features
- **Spacing:** Vertical gap-4, centered in column
- **Button Size:** 48x48px (w-12 h-12)

### Center Video Area
- **Layout:** Flexbox column, centered
- **Video:** max-w-6xl, aspect-video (16:9)
- **Responsive:**
  - Mobile: `p-4`
  - Tablet: `px-6`
  - Desktop: `px-8 lg:p-6`
- **Control Bar:** Positioned below video with gap-6
- **Gap:** 24px between video and controls (`gap-6`)

### Right Sidebar (Chat & Participants)
- **Visible:** Tablet+ (`md:flex`)
- **Width:**
  - Mobile: Hidden
  - Tablet: `w-80` (320px)
  - Desktop: `w-96` (384px)
- **Layout:** Flex column with gap-4
- **Content:** Participants grid (3 cols) + Chat input fixed bottom

### Control Bar
- **Position:** Center with video area
- **Layout:** Flex row, centered, gap-4
- **Width:** Max 512px (max-w-2xl)
- **Buttons:** 
  - Regular buttons: 48x48px (`w-12 h-12`)
  - End call: 56x56px (`w-14 h-14`) - visually prominent
- **Divider:** 40px height (`h-10`), 1px width (`w-px`)

### Participants Grid
- **Layout:** Grid with 3 columns (`grid-cols-3`)
- **Gap:** 12px between items (`gap-3`)
- **Avatar:** Square aspect ratio (`aspect-square`)
- **Max Height:** 256px with scroll (`max-h-64`)
- **Text:** Always visible at bottom with gradient overlay

### Chat Messages
- **Message Container:** Flex row, direction changes based on sender
- **Own Messages:** Right-aligned (`flex-row-reverse`), blue background
- **Others' Messages:** Left-aligned, glass background
- **Avatar:** 28x28px fixed size
- **Name/Time:** Small text (12px), gray
- **Max Width:** 75% of container

### Chat Input
- **Position:** Fixed at bottom of chat
- **Layout:** Flex row with gap-2
- **Items:** Attachment button + input field + send button
- **Sizing:** Full width with responsive padding
- **Interactive:** Focus ring on input, disabled state on send

---

## Spacing Scale

All spacing follows Tailwind's base of 4px:

| Class | Size | Usage |
|-------|------|-------|
| `gap-1` | 4px | Tight spacing |
| `gap-2` | 8px | Small gaps |
| `gap-3` | 12px | Medium gaps (participant grid) |
| `gap-4` | 16px | Standard gap (buttons) |
| `gap-6` | 24px | Large gap (video to controls) |
| `gap-8` | 32px | Extra large (sections) |
| `p-2` | 8px | Small padding |
| `p-3` | 12px | Medium padding |
| `p-4` | 16px | Standard padding |
| `p-6` | 24px | Large padding |

---

## Color Scheme & Status Indicators

### Message Status
- **Your Message:** `bg-blue-600/40` with `border-blue-500/50`
- **Others' Message:** `glass` (semitransparent)
- **System Message:** Gray background

### Button States
- **Default:** Gray with `bg-slate-700/20`
- **Active/Hovered:** Slightly lighter, scale 1.05
- **Active Feature:** Green with `bg-green-500/30`
- **End Call:** Red with `bg-red-500` and `hover:bg-red-600`

### Participant Status (Chat)
- **Host:** Blue dot + "Host" text in blue
- **Active:** Green pulsing dot + "Active"
- **Idle:** Amber dot + "Idle"

### Connection Status (Header)
- **Connected:** Green circle (🟢)
- **Recording:** Red pulsing circle (REC)

---

## Animation & Interaction

### Entrance Animations
- **Header:** Slides down from top, 0.5s
- **Video:** Scales from 0.9, opacity fade, 0.5s delay
- **Control Bar:** Slides up from bottom, opacity fade
- **Sidebars:** Slide in from sides, 0.5s

### Hover Effects
- **Buttons:** Scale 1.1 on hover, 0.95 on tap
- **Messages:** Subtle color shift
- **Participant Cards:** Scale 1.05, remove button overlay appears
- **Chat Messages:** Animation on new message entry

### Continuous Animations
- **Call Timer:** Pulse scale (1 → 1.02 → 1) every 1s
- **Recording Indicator:** Pulse scale every 2s
- **Volume Indicator:** Scale pulse every 0.3s
- **Participant Status Dots:** Pulse continuously if active

---

## Accessibility Features

### Keyboard Navigation
- Tab through all buttons in order
- Enter/Space to activate buttons
- Arrow keys in lists
- Escape to close modals

### Screen Reader
- Proper heading hierarchy
- Alt text on all images/emojis (titles)
- ARIA labels on buttons
- Role attributes on custom components

### Visual Indicators
- Names always visible (not hover-only)
- Color + icon for status (not color alone)
- Size variation for importance (end call larger)
- High contrast ratios maintained

---

## Troubleshooting

### Video not centered?
- Check max-w-6xl on parent container
- Verify aspect-video class present
- Ensure parent height is set (h-full)

### Controls misaligned?
- Verify `flex items-center justify-center`
- Check gap-4 applied
- Ensure max-w-2xl limits width

### Chat input not at bottom?
- Parent div must use `flex flex-col`
- Input should be outside scrollable area
- Use `border-t` for visual separation

### Mobile layout breaking?
- Check responsive classes (sm:, md:, lg:)
- Verify overflow-hidden on containers
- Ensure padding adjusts per breakpoint

---

## Development Checklist

- [x] 3-column grid layout (nav, video, sidebar)
- [x] Video centered with 16:9 ratio
- [x] Control bar horizontally aligned
- [x] Participants grid 3 columns
- [x] Chat input fixed at bottom
- [x] Responsive mobile/tablet/desktop
- [x] Consistent spacing scale
- [x] Accessibility features
- [x] Smooth animations
- [x] Zero layout overlaps
- [x] Professional appearance

---

Created: March 4, 2026
Version: 2.0 (Professional Layout Edition)
