# 🛠️ Development Guide

## Getting Started

### Prerequisites
- Node.js 16+ ([Download](https://nodejs.org))
- npm 7+ (comes with Node.js)
- Code editor (VS Code recommended)

### Initial Setup

```bash
# Clone or navigate to project directory
cd video-call-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:5173
```

---

## Available Commands

### Development
```bash
npm run dev
# Start Vite dev server with hot module replacement
# Available at: http://localhost:5173
# Auto-reloads on file changes
```

### Production Build
```bash
npm run build
# Compile TypeScript
# Bundle and optimize code
# Generate: /dist folder
# Output: Minified files, optimized bundle
```

### Preview Production Build
```bash
npm run preview
# Serve production build locally
# Useful for testing production behavior
# Available at: http://localhost:5173 (or next available port)
```

---

## Project Structure Guide

### Adding a New Component

#### Step 1: Create Component File
```bash
# Create new file in src/components/
# Example: src/components/MyNewComponent.tsx
```

#### Step 2: Implement Component
```typescript
import { motion } from 'framer-motion'
import { ExampleIcon } from 'lucide-react'

interface MyComponentProps {
  title: string
  onAction: () => void
}

export default function MyNewComponent({ title, onAction }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-xl p-4 space-y-2"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <button
        onClick={onAction}
        className="px-4 py-2 rounded-lg glass hover:bg-white/20"
      >
        Click Me
      </button>
    </motion.div>
  )
}
```

#### Step 3: Import in App
```typescript
// In App.tsx
import MyNewComponent from './components/MyNewComponent'

// In render
<MyNewComponent 
  title="New Feature" 
  onAction={() => console.log('clicked')} 
/>
```

---

## Styling Guide

### Using Tailwind CSS

#### Common Patterns
```typescript
// Layout
className="flex items-center justify-center gap-4"
className="grid grid-cols-3 gap-2"

// Spacing
className="p-4 m-2"               // Padding/Margin: 1rem / 0.5rem
className="px-6 py-3"             // Horizontal/Vertical padding

// Sizing
className="w-full h-screen"       // Full width/height
className="w-1/2 h-1/3"          // Fractions
className="w-20 h-20"            // Fixed size (80px)

// Colors
className="bg-slate-900"          // Background
className="text-white"            // Text color
className="border-blue-500"       // Border

// Rounded corners
className="rounded-lg"            // 8px
className="rounded-xl"            // 12px
className="rounded-2xl"           // 16px
className="rounded-full"          // Circle

// Effects
className="glass"                 // Custom glassmorphism
className="shadow-lg"             // Drop shadow
className="hover:bg-white/20"     // Hover effects
```

### Creating Custom Classes
```css
/* In src/index.css */
@layer components {
  .custom-button {
    @apply px-4 py-2 rounded-lg glass hover:bg-white/20 transition-all;
  }
}
```

### Responsive Design
```typescript
className="hidden md:block lg:grid"  // Hide on mobile, block on tablet+
className="w-full md:w-1/2 lg:w-1/3"  // Responsive widths
className="p-2 md:p-4 lg:p-6"         // Responsive padding
className="flex-col md:flex-row"      // Responsive direction
```

---

## Animation Guide

### Using Framer Motion

#### Basic Animation
```typescript
<motion.div
  initial={{ opacity: 0, y: -20 }}    // Starting state
  animate={{ opacity: 1, y: 0 }}      // End state
  transition={{ duration: 0.5 }}      // Duration in seconds
>
  Content
</motion.div>
```

#### Hover Effects
```typescript
<motion.button
  whileHover={{ scale: 1.1 }}        // Scale on hover
  whileTap={{ scale: 0.95 }}         // Scale on click
  transition={{ type: "spring", stiffness: 200 }}
>
  Interactive Button
</motion.button>
```

#### Continuous Animation
```typescript
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 2, repeat: Infinity }}
>
  Spinning Icon
</motion.div>
```

#### Staggered Animation
```typescript
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ x: -100, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: index * 0.1 }}  // Staggered delay
  >
    {item.name}
  </motion.div>
))}
```

#### Variants
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

<motion.div initial="hidden" animate="show" variants={containerVariants}>
  {/* Children */}
</motion.div>
```

---

## Component Communication

### Props Passing
```typescript
// Parent
<VideoContainer isCameraOn={isCameraOn} isScreenSharing={isScreenSharing} />

// Child
interface VideoContainerProps {
  isCameraOn: boolean
  isScreenSharing: boolean
}

export default function VideoContainer({ isCameraOn, isScreenSharing }: VideoContainerProps) {
  // Use props
}
```

### Event Callbacks
```typescript
// Parent
const handleMicToggle = () => {
  setIsMicOn(!isMicOn)
}

<ControlBar onMicToggle={handleMicToggle} />

// Child
interface ControlBarProps {
  onMicToggle: () => void
}

<button onClick={onMicToggle}>Toggle Mic</button>
```

### Global State (Toast System)
```typescript
// App level
const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
  // Toast logic
}

// Pass to children
<ChatSidebar onAddToast={addToast} />

// Child usage
<button onClick={() => onAddToast('Message sent', 'success')}>
  Send
</button>
```

---

## Working with Icons (Lucide React)

### Importing Icons
```typescript
import { Mic, MicOff, Video, VideoOff, Phone, Monitor } from 'lucide-react'
```

### Using Icons
```typescript
// Basic usage
<Mic className="w-5 h-5" />

// With color
<Mic className="w-5 h-5 text-blue-400" />

// With animation
<motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity }}>
  <Settings className="w-5 h-5" />
</motion.div>

// Find icons at: https://lucide.dev
```

---

## State Management Patterns

### Local Component State
```typescript
import { useState } from 'react'

export default function MyComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

### Managing Multiple State
```typescript
// Individual states (current pattern)
const [isMicOn, setIsMicOn] = useState(true)
const [isCameraOn, setIsCameraOn] = useState(true)
const [isScreenSharing, setIsScreenSharing] = useState(false)

// Or use object state (alternative)
const [callState, setCallState] = useState({
  isMicOn: true,
  isCameraOn: true,
  isScreenSharing: false,
})
```

### Effect Hooks
```typescript
import { useEffect } from 'react'

useEffect(() => {
  // This runs after component mounts and after EVERY render
  console.log('Component rendered')
  
  return () => {
    // Cleanup function (runs before unmount)
  }
}, []) // Dependency array - effect runs once if empty
```

---

## Common Development Tasks

### Changing Colors
```typescript
// Edit tailwind.config.ts for global colors
// Or use Tailwind color utilities directly

// Example - Blue theme
className="bg-blue-500 text-blue-100 border-blue-600"

// Available colors: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose
```

### Changing Fonts
```typescript
// In index.html
<link href="https://fonts.googleapis.com/css2?family=NewFont:wght@400;500;600;700&display=swap" rel="stylesheet" />

// In tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['NewFont', 'system-ui', 'sans-serif'],
    },
  },
}
```

### Adding Breakpoints
```typescript
// In tailwind.config.ts
theme: {
  extend: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
}
```

### Adding Custom Animation
```typescript
// In tailwind.config.ts
animation: {
  slideIn: 'slideIn 0.3s ease-out',
  bounce: 'bounce 1s infinite',
}

keyframes: {
  slideIn: {
    '0%': { transform: 'translateX(100%)' },
    '100%': { transform: 'translateX(0)' },
  },
}

// Usage
className="animate-slideIn"
```

---

## Debugging Tips

### React DevTools
1. Install [React DevTools](https://react-devtools-tutorial.vercel.app/) extension
2. Open DevTools (F12)
3. Go to React tab
4. Inspect component tree
5. View props and state

### Console Logging
```typescript
// In component
useEffect(() => {
  console.log('microphone changed:', isMicOn)
}, [isMicOn])

// View in browser console (F12)
```

### Breaking on Errors
```typescript
// Add error boundary
// Or check browser console for errors (F12)
```

### Testing Responsive Design
```
Browser DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
Test different screen sizes and orientations
```

---

## Performance Optimization

### Memoizing Components
```typescript
import { memo } from 'react'

const ExpensiveComponent = memo(function Component({ prop }) {
  return <div>{prop}</div>
})
```

### Optimizing Animations
```typescript
// Use CSS transforms (GPU-accelerated)
animate={{ x: 100, scale: 1.1 }}

// Avoid animating these (CPU-intensive)
// animate={{ width: 100, height: 200 }}

// Use will-change in CSS for hints
className="will-change-transform"
```

### Checking Bundle Size
```bash
npm run build
# Check /dist folder size
# Main bundle should be under 300KB uncompressed
```

---

## Git Workflow

### Basic Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "feat: add new feature"

# Push
git push origin main

# Pull
git pull origin main
```

### Commit Message Format
```
feat: add new feature
fix: fix bug in component
style: update styling
refactor: reorganize code
docs: update documentation
perf: improve performance
```

---

## Troubleshooting

### Hot Module Replacement (HMR) Not Working
```bash
# Restart dev server
npm run dev

# Clear cache
rm -rf node_modules dist
npm install
npm run dev
```

### Port Already in Use
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5173
kill -9 <PID>
```

### TypeScript Errors
```bash
# Check for errors
npm run build

# Verify tsconfig.json is correct
# Common issue: missing types for packages
# npm install --save-dev @types/package-name
```

### Build Failures
```bash
# Clear build cache
rm -rf dist

# Rebuild
npm run build

# Check for console errors
# Look in STDERR output
```

### Dependency Conflicts
```bash
# Check audit
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break compatibility)
npm audit fix --force
```

---

## Useful Links

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)
- [Vite Docs](https://vitejs.dev)

### Tools
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

### Learning Resources
- [React Tutorial](https://react.dev/learn)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs/installation)
- [Framer Motion Tutorial](https://www.framer.com/motion/)

---

## VS Code Setup (Recommended)

### Extensions
```
bradlc.vscode-tailwindcss         - Tailwind CSS IntelliSense
dsznajder.es7-react-js-snippets   - React snippets
dbaeumer.vscode-eslint            - ESLint
esbenp.prettier-vscode            - Code formatter
```

### Settings (.vscode/settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Next Steps

1. **Understand the component structure** - Read ARCHITECTURE.md
2. **Review existing components** - Study src/components/
3. **Create a new component** - Practice adding your own feature
4. **Test responsive design** - Check on different screen sizes
5. **Deploy the project** - Follow deployment guide
6. **Integrate with backend** - Add real data and API calls

---

**Happy coding! 🚀**
