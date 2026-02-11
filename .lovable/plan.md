

# FocusGuard Premium UI Overhaul

Transform the current functional-but-basic extension into a polished, SaaS-grade product with glassmorphism design, micro-animations, SVG-based circular charts, an onboarding flow, and a redesigned sidebar dashboard.

## Summary of Changes

This upgrade touches **11 existing files** and creates **3 new files** (onboarding page + CSS + JS). No backend or logic changes -- purely visual and structural UI upgrades. The background.js message handler gets one new action for onboarding state.

---

## Part 1: Design System Foundation

**File: `extension/assets/styles-common.css`** -- Complete rewrite

- Import Inter font from Google Fonts (lightweight, 400/500/600/700 weights)
- CSS custom properties for the full color system:
  - `--bg-deep: #08081a` (deepest background)
  - `--bg-primary: #0c0c1e` (main background)
  - `--bg-glass: rgba(20, 20, 45, 0.6)` (glassmorphism panels)
  - `--bg-glass-border: rgba(255, 255, 255, 0.06)`
  - `--accent: #5B8CFF` (Electric Blue primary)
  - `--accent-glow: rgba(91, 140, 255, 0.25)`
  - `--success: #34D399` (Soft Green)
  - `--warning: #FBBF24` (Soft Orange)
  - `--danger: #F87171` (Soft Red)
  - `--text-primary: #E8ECF4`
  - `--text-secondary: #7A8BA7`
  - `--text-muted: #4A5568`
- Reusable `.glass` class: `backdrop-filter: blur(20px)`, subtle border, soft shadow
- CSS keyframe animations:
  - `@keyframes fadeUp` (opacity 0 to 1, translateY 12px to 0, 350ms)
  - `@keyframes fadeIn` (opacity only, 300ms)
  - `@keyframes pulse-glow` (box-shadow pulse for active focus state)
  - `@keyframes countUp` (for animated number counters using CSS counter)
  - `@keyframes slideIn` (for sidebar page transitions)
  - `@keyframes shimmer` (loading skeleton effect)
- Utility classes: `.fade-up`, `.glass-card`, `.glow-active`, `.text-gradient`
- Consistent 8px spacing grid
- Custom scrollbar with rounded thumb matching theme
- All border-radius bumped to 16px for cards, 12px for buttons, 24px for pills

---

## Part 2: Extension Popup -- Premium Command Center

**Files: `extension/popup/popup.html`, `popup.css`, `popup.js`**

### HTML Restructure
- New layout hierarchy:
  1. **Header**: Logo (SVG shield icon instead of emoji) + "FocusGuard" gradient text + streak badge (pill shape with fire icon and glow if active) + settings gear icon + dashboard icon
  2. **Score Hero Card**: Large centered glassmorphism card containing:
     - SVG circular progress ring (animated) showing productivity score 0-100
     - Score number inside the ring (large, gradient-colored)
     - Score label below ("Excellent", "Good", etc.)
     - Three mini stat pills underneath: Focus time | Distraction time | Active time
  3. **Focus Mode Section**: 
     - When inactive: Duration pill selector (15/25/45/60 with sliding highlight indicator) + large "Start Focus" button with gradient and subtle glow
     - When active: Large timer display (monospace, glowing blue) + circular progress ring around timer + Pause/Stop buttons with icon-only minimal style
  4. **Top Sites**: Horizontal bars with category-colored dots, domain favicon placeholder (first letter circle), time on right, subtle glass background per row
  5. **Quick Actions Row**: Two icon buttons side-by-side -- "Block This Site" and "Open Dashboard" -- with glass styling
  
### CSS Overhaul
- Body: `width: 360px` (slightly wider for breathing room), `min-height: 480px`
- All cards use `.glass` class with `backdrop-filter: blur(20px)`, `background: var(--bg-glass)`, `border: 1px solid var(--bg-glass-border)`
- Score ring: SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset` animated via CSS transition
- Duration selector: Pills with sliding background indicator (absolute positioned div that transitions `transform: translateX`) instead of toggling classes
- Start Focus button: `background: linear-gradient(135deg, var(--accent), #7C6AFF)`, `box-shadow: 0 4px 24px var(--accent-glow)`, hover scales to 1.02
- All interactive elements: `transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1)`
- Domain bars: Rounded 6px height bars with gradient fills matching category colors, 250ms width transition
- Streak badge: If streak > 0, gets `animation: pulse-glow 2s infinite`
- `.fade-up` class applied to each section with staggered `animation-delay` (0ms, 80ms, 160ms, 240ms) for entrance animation

### JS Enhancements
- `animateNumber(element, target, duration)` function: Animates from 0 to target value using requestAnimationFrame, 600ms ease-out
- Score ring: Calculate `stroke-dashoffset` based on score percentage, animate on load
- All stat values use `animateNumber` on first load
- Add favicon circle rendering for domain bars (first letter of domain, colored background)

---

## Part 3: Dashboard -- Sidebar Layout with Glassmorphism

**Files: `extension/dashboard/dashboard.html`, `dashboard.css`, `dashboard.js`**

### HTML Restructure -- Sidebar Layout
Replace top tab bar with permanent left sidebar:

```text
+------------------+----------------------------------------+
|  [Shield Logo]   |                                        |
|  FocusGuard      |   Main Content Area                    |
|                  |                                        |
|  > Overview      |   (changes based on active nav)        |
|    Daily         |                                        |
|    Weekly        |                                        |
|    Domains       |                                        |
|    Focus Logs    |                                        |
|    Settings      |                                        |
|                  |                                        |
|  [Score: 78]     |                                        |
|  [Streak: 4]     |                                        |
+------------------+----------------------------------------+
```

- Sidebar: 240px fixed width, glass background, nav items with icons (SVG inline) + labels
- Active nav item: Left 3px accent-colored indicator bar + text color change + subtle background
- Bottom of sidebar: Mini score display + streak counter
- Main content: Scrollable, padded, with page transitions

### New Dashboard Pages (all within same HTML, JS-driven)

**Overview Page:**
- Top row: 4 stat cards (glass style) with animated numbers -- Active Time, Focus %, Score (with circular ring), Streak
- Score card gets a large SVG donut ring showing productive vs distracted ratio
- Charts row 1: Domain Usage (horizontal bars, glass card) + Category Breakdown (SVG donut chart instead of canvas -- smoother, animatable)
- Charts row 2: Hourly Activity (canvas bar chart with rounded tops and gradient fills)
- Charts row 3: Weekly Trends (canvas with gradient area fill under line)

**Daily Report Page (NEW):**
- Hour-by-hour heatmap grid (24 columns, color intensity based on productivity level)
- Session timeline (vertical timeline with dots and lines)
- Summary stats for the day

**Weekly Report Page (NEW):**
- 7-day bar chart comparison
- Trend line overlay
- Pattern detection panel: Most distracted day, best focus day, avg session length, streak consistency
- Weekend vs weekday comparison cards

**Domains Page (NEW):**
- Sortable table with columns: Domain, Category (colored pill badge), Total Time, Sessions, Avg Session, Blocked toggle
- Search/filter input at top
- Click row to expand details

**Focus Logs Page (existing sessions tab, enhanced):**
- Card-based layout instead of plain table
- Each session card shows: time, duration bar, tasks completed indicator dots, interruption count, status badge (green/red pill)
- Empty state with illustration text

**Settings Page (enhanced):**
- Grouped sections with clear headers and descriptions
- Toggle switches (custom CSS) instead of checkboxes
- Blocked domains: Glass-styled tags with X button, smooth add/remove animation
- Daily limits: Slider-style input or clean number inputs
- Focus defaults: Clean form with labeled inputs
- Save button with success feedback (checkmark animation)

### CSS Overhaul
- Full sidebar layout: `display: grid; grid-template-columns: 240px 1fr`
- Sidebar: `background: var(--bg-glass)`, `backdrop-filter: blur(24px)`, `border-right: 1px solid var(--bg-glass-border)`, full height
- Nav items: 44px height, 12px left padding, `border-radius: 10px`, hover background transition
- Active indicator: `::before` pseudo-element, 3px wide, accent color, rounded, positioned left
- Main content area: `padding: 32px`, `max-width: 960px`
- All cards: `.glass-card` class
- Canvas charts: Updated drawing code with rounded bar tops (`ctx.roundRect`), gradient fills (`ctx.createLinearGradient`), softer grid lines (#1a1a30 instead of harsh lines)
- SVG donut charts: Animated `stroke-dashoffset` transitions on load
- Table rows: Glass background on hover, smooth transitions
- Page transitions: Content fades in with `.fade-up` animation when switching tabs

### JS Enhancements
- Replace category pie chart with SVG donut (no canvas) -- smoother rendering, CSS-animatable
- Add `animateNumber` to all stat displays
- Canvas charts: Use gradients for bar fills, rounded corners, anti-aliased rendering
- Add sort functionality to domains table
- Smooth tab transitions with opacity fade

---

## Part 4: Blocked Page -- Cinematic Intervention

**Files: `extension/blocked/blocked.html`, `blocked.css`, `blocked.js`**

### Visual Upgrade
- Full-screen centered layout with subtle animated background gradient (slow-moving radial gradient, dark tones)
- Shield icon: Large SVG with soft glow animation
- "Site Blocked" title: Large bold text with red-to-orange gradient
- Domain name: Monospace font, soft red pill badge
- Quote box: Glass card with elegant italic typography, soft left border accent
- Unlock requirements section: Glass card with:
  - Each requirement row: Icon + label + status + animated progress bar
  - Progress bars: 8px height, rounded, gradient fills that animate from 0 to current value on load
  - Met requirements: Green checkmark icon, green progress fill
  - Unmet: Muted gray with accent-colored partial fill
- Unlock success: Confetti-style CSS animation (scattered dots expanding outward), green glow, large unlock button
- Override section: Collapsed by default, subtle styling, reflection timer with circular countdown animation (SVG circle shrinking)
- Go Back button: Ghost style, minimal

---

## Part 5: Floating Widget -- Premium Bubble

**File: `extension/content.js`**

### Visual Upgrade
- Minimized state: 44px circle with glass background, shield SVG icon, subtle pulse animation when focus is active
- Expanded state: 220px wide glass card with `backdrop-filter: blur(24px)`, rounded 16px corners, soft shadow
- Header: Compact with logo + title + minimize button (custom X icon)
- Stats: Clean rows with dot indicators, monospace numbers
- Focus timer (when active): Accent-colored text with subtle glow
- Block button: Soft red glass style
- Smooth expand/collapse animation (scale + opacity, 300ms cubic-bezier)
- Drag handle area: Only header is draggable (better UX)

---

## Part 6: Onboarding Flow (NEW)

**New files: `extension/onboarding/onboarding.html`, `onboarding.css`, `onboarding.js`**

### Structure
Opens in new tab on first install (triggered from `background.js` `onInstalled` listener).

5-step wizard:
1. **Welcome**: Large shield icon with glow, "Welcome to FocusGuard" headline, "Your Behavioral Productivity OS" subtitle, "Get Started" button
2. **Select Distracting Sites**: Grid of common sites (YouTube, Instagram, Twitter, TikTok, Reddit, Netflix, etc.) as toggleable cards with icons, plus custom domain input
3. **Set Daily Goal**: Slider or number input -- "How many hours of focused work per day?" (1-8 hours), visual representation
4. **Choose Focus Duration**: Duration pills (15/25/45/60 min) with description of each, default highlighted
5. **Ready**: Success animation, summary of choices, "Launch FocusGuard" button

### Design
- Full-screen, centered content, max-width 600px
- Step indicator: 5 dots at top, active dot is accent-colored and larger
- Smooth slide transitions between steps (translateX animation)
- Glass cards for each step content
- All buttons follow the premium gradient style
- Progress saved to chrome.storage on each step

### Background.js Addition
- In `onInstalled` handler: Check if onboarding completed (`focusguard_onboarded` key), if not, open onboarding tab
- Add `onboarding.html` to `web_accessible_resources` in manifest

---

## Part 7: Manifest Updates

**File: `extension/manifest.json`**

- Add `onboarding/onboarding.html`, `onboarding/onboarding.css`, `onboarding/onboarding.js` to `web_accessible_resources`

---

## Part 8: Background.js Minor Update

**File: `extension/background.js`**

- In `onInstalled` listener: Add check for `focusguard_onboarded` flag, open onboarding tab if not set
- Add `completeOnboarding` message handler that saves initial settings from onboarding choices

---

## Implementation Order

1. `assets/styles-common.css` -- Design system foundation (everything else depends on this)
2. `popup/popup.html` + `popup.css` + `popup.js` -- Popup UI redesign
3. `content.js` -- Widget visual upgrade
4. `blocked/blocked.html` + `blocked.css` + `blocked.js` -- Block page upgrade
5. `dashboard/dashboard.html` + `dashboard.css` + `dashboard.js` -- Full dashboard rebuild (largest change)
6. `onboarding/onboarding.html` + `onboarding.css` + `onboarding.js` -- New onboarding flow
7. `manifest.json` + `background.js` -- Manifest updates and onboarding trigger

## Technical Notes

- All styling is pure CSS (no frameworks) -- keeps extension lightweight
- SVG circles for score rings instead of canvas -- better animation and resolution
- Inter font loaded via Google Fonts CDN in each HTML file's `<head>`
- All animations use `cubic-bezier(0.4, 0, 0.2, 1)` for Material-style easing
- 8px spacing grid enforced throughout (padding/margin in multiples of 8)
- No new dependencies or libraries -- pure vanilla JS/CSS/HTML
- Background.js logic remains unchanged except for the onboarding trigger

