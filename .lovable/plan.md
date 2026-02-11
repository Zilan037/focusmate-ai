

# FocusGuard Ultimate Premium UI Overhaul

A complete visual and feature upgrade across all extension pages -- popup, dashboard, blocked page, onboarding, and floating widget -- plus light mode support and new advanced features. All changes stay within the `extension/` folder and are synced to `public/extension/`.

---

## Part 1: Light/Dark Theme System

**File: `extension/assets/styles-common.css`**

Add a `[data-theme="light"]` selector that overrides all CSS variables:

- `--bg-deep: #F5F7FA`, `--bg-primary: #FFFFFF`, `--bg-card: #F0F2F5`
- `--bg-glass: rgba(255, 255, 255, 0.7)`, `--bg-glass-border: rgba(0, 0, 0, 0.06)`
- `--text-primary: #1A1A2E`, `--text-secondary: #5A6478`, `--text-muted: #8A95A8`
- Accent colors stay the same for brand consistency
- Shadows become lighter: `--shadow-md: 0 4px 16px rgba(0,0,0,0.06)`
- Scrollbar thumb adjusts for light backgrounds

Add a `.theme-toggle` button component (sun/moon icon swap with CSS transition).

**All HTML files** get `<script>` at top of `<head>` that reads `focusguard_theme` from `chrome.storage.local` and applies `data-theme` attribute before paint (prevents flash).

---

## Part 2: Design System Enhancements

**File: `extension/assets/styles-common.css`**

New additions to the existing design system:

- Add `--accent-violet: #7C6AFF` and `--accent-violet-glow` variables
- Add `--gradient-glass: linear-gradient(135deg, rgba(91,140,255,0.05), rgba(124,106,255,0.05))` for subtle card backgrounds
- New keyframes:
  - `@keyframes float` (gentle Y oscillation for decorative elements)
  - `@keyframes borderGlow` (animated border color cycling)
  - `@keyframes countUp` (number counter effect)
  - `@keyframes slideUp` / `@keyframes slideDown` for smooth panel reveals
- New utility classes:
  - `.card-hover-lift` (translateY(-2px) + shadow increase on hover)
  - `.number-mono` (tabular-nums, font-weight 800)
  - `.section-header` (consistent section header style)
  - `.empty-illustration` (better empty state with SVG illustration)
- Enhanced `.glass-card`: Add subtle inner gradient highlight at top edge
- Add `.glass-card-interactive` variant with hover lift and border glow
- Improved toggle switch with smoother animation and better sizing

---

## Part 3: Popup -- Premium Command Center V2

**Files: `extension/popup/popup.html`, `popup.css`, `popup.js`**

### New Features
- **Theme toggle button** in header (sun/moon icon)
- **Today's insight card** below score: Shows one auto-generated behavioral insight in a compact card (e.g., "You've been 23% more focused than yesterday")
- **Quick stats ticker** at the very top: scrolling micro-stats line ("4 sites visited | 2h focused | Score: 78")

### Visual Upgrades
- Score ring gets animated gradient stroke (shifts colors smoothly)
- Score number uses animated counter with overshoot spring effect
- Stat pills get subtle gradient backgrounds based on their category color
- Domain bars get real favicon attempts via `https://www.google.com/s2/favicons?domain=X&sz=32` with fallback to letter circle
- Focus Mode section gets a pulsing border animation when active
- Duration selector pills get a morphing blob background that slides between options (not just translateX of a box)
- Quick action buttons get icon-only hover tooltip style with descriptive labels
- Add subtle particle/dot decorative elements in the background (CSS-only radial gradients)
- Popup width stays 360px but gets slightly taller padding for breathing room

### CSS Changes
- Add CSS `background-attachment: fixed` subtle gradient mesh on body
- Improved spacing using `gap` properties
- Better focus states (visible outlines for accessibility)
- Smooth transitions on all interactive elements

### JS Changes
- Add theme toggle handler that saves to `chrome.storage.local` and applies immediately
- Fetch one insight from background and display in compact card
- Favicon loading with `onerror` fallback

---

## Part 4: Dashboard -- Premium Analytics V2

**Files: `extension/dashboard/dashboard.html`, `dashboard.css`, `dashboard.js`**

### New Sidebar Features
- **Theme toggle** at bottom of sidebar (above score/streak)
- **Collapse/expand sidebar** button (hamburger icon) -- sidebar collapses to icon-only 60px width
- Active nav item gets an animated gradient indicator bar (not just static color)
- Nav items get subtle icon color matching their section purpose

### New Dashboard Pages/Sections

**Overview Page Upgrades:**
- Stat cards get animated gradient borders that pulse subtly
- Score card gets a larger ring with gradient stroke and particle burst animation on load
- Add "Compared to yesterday" percentage badges on each stat card (green up arrow / red down arrow + percentage)
- Category donut chart: Add hover tooltips showing exact time + percentage
- Hourly activity chart: Add a "peak productivity" indicator marker on the highest productive hour
- Add a "Quick Actions" row at bottom: Start Focus, Block Site, Export Data buttons

**Daily Report Upgrades:**
- Add date picker navigation (prev/next day arrows + date display)
- Heatmap cells get tooltips on hover showing exact activity breakdown
- Add a "Daily Timeline" -- vertical timeline showing site visits as colored dots on a line
- Session cards below the heatmap

**Weekly Report Upgrades:**
- Add "This Week vs Last Week" comparison bars
- Pattern detection cards get icons and colored borders
- Add "Best Hour" and "Worst Hour" analysis cards

**Domains Page Upgrades:**
- Add favicon images for each domain row
- Add sparkline mini-charts showing time trend for each domain (last 7 days, tiny canvas)
- Category pills get matching colored backgrounds
- Add "Export as CSV" button

**Focus Logs Upgrades:**
- Session cards get a visual timeline bar showing how much of the planned time was completed
- Add task completion dots (filled/unfilled circles)
- Better empty state with illustration SVG and "Start your first session" CTA

**Insights Page Upgrades:**
- Insight cards get category-specific icons (lightbulb for tips, chart for data, warning for alerts)
- Add animated entry for each card (staggered fade-up)
- Distraction loop cards get a visual domain chain showing the loop path

**Settings Page Upgrades:**
- Add **Theme** section at top with light/dark toggle
- Add **Data Management** section: Export All Data (JSON), Import Data, Clear All Data (with confirmation)
- Add **About** section: Version number, links
- Blocked domain tags get a nicer pill design with smooth remove animation
- Daily limit items show a mini progress bar of today's usage
- Toggle switches for: Widget enabled, Strict mode, Notifications
- All settings sections get collapsible accordion behavior

### CSS Changes
- Sidebar collapse animation: `width` transition from 240px to 60px, labels fade out, icons center
- Card hover effects: `transform: translateY(-2px)` + `box-shadow` increase
- Table row hover: subtle left border accent appears
- Canvas backgrounds: match theme (transparent for dark, slight fill for light)
- Better responsive breakpoints: sidebar becomes bottom nav on mobile
- Smooth page transitions between tabs (opacity + translateY)

### JS Changes
- Add `animateNumber` to all numeric displays
- Add date navigation for daily report
- Add sparkline drawing function for domain rows
- Add CSV export function
- Add JSON data export/import functions
- Add theme toggle handler
- Sidebar collapse toggle with localStorage persistence
- Tooltip rendering for charts (canvas overlay)

---

## Part 5: Blocked Page -- Enhanced Cinematic Experience

**Files: `extension/blocked/blocked.html`, `blocked.css`, `blocked.js`**

### Visual Upgrades
- Background: Add animated CSS gradient orbs (floating colored circles with blur)
- Shield icon: Add rotating ring animation around it
- Quote card: Add auto-rotating quotes (new quote every 10 seconds with fade transition)
- Unlock requirements: Progress bars get animated shimmer effect while incomplete
- Met requirements: Checkmark icon animates in (SVG stroke-dashoffset animation)
- Override reflection timer: Gets a breathing animation on the ring
- Add a "Time on this page" counter showing how long they've been on the blocked page

### New Features
- **Breathing exercise option**: "Take a breath" button that opens a 30-second guided breathing animation (expanding/contracting circle) as an alternative activity
- Theme support (reads from storage)

---

## Part 6: Floating Widget -- Smarter Bubble

**File: `extension/content.js`**

### Visual Upgrades
- Minimized bubble: Gets a micro progress ring around it showing today's focus percentage
- Expanded panel: Gets theme-aware styling
- Stats rows: Get mini colored bar indicators next to values
- Block button: Smoother hover animation

### New Features
- **Quick focus start**: Add a "Focus 25m" mini button in expanded view
- Widget auto-hides during focus mode (only shows timer bubble)
- Theme-aware: reads `focusguard_theme` and applies light/dark styling

---

## Part 7: Onboarding -- Polish Pass

**Files: `extension/onboarding/onboarding.html`, `onboarding.css`, `onboarding.js`**

### Visual Upgrades
- Step transitions: Use `translateX` slide animation instead of simple fade
- Site cards: Add real favicon attempts
- Goal slider: Add visual bar showing "Beginner / Intermediate / Expert" labels at different positions
- Ready screen: Add confetti CSS animation on the checkmark
- Theme-aware styling

### New Step
- Add Step 3.5 (between goal and duration): **Choose Theme** -- light/dark toggle preview with live preview of how the extension looks

---

## Part 8: Background.js Additions

**File: `extension/background.js`**

- Add `getTheme` message handler (returns stored theme or "dark" default)
- Add `setTheme` message handler (saves to storage)
- Add `exportData` message handler (collects all storage data into JSON)
- Add `importData` message handler (validates and writes data)
- Add `getComparisonStats` message handler (compares today vs yesterday for stat cards)
- Add `getTodayInsightSummary` handler (returns one compact insight text for popup)

---

## Part 9: Manifest Update

**File: `extension/manifest.json`**

- No structural changes needed, just ensure all new resources are accessible

---

## Part 10: Sync to Public

All modified files are copied to `public/extension/` so the user can download and test.

---

## Implementation Order

1. `styles-common.css` -- Theme system + design tokens
2. `background.js` -- New message handlers
3. `popup/` -- Popup premium V2
4. `dashboard/` -- Full dashboard overhaul (largest change)
5. `blocked/` -- Cinematic upgrades
6. `content.js` -- Widget improvements
7. `onboarding/` -- Polish + theme step
8. Copy all to `public/extension/`

## Technical Notes

- Theme detection script placed in `<head>` of every HTML page to prevent flash of wrong theme
- All CSS uses `var()` references so theme switching is instant
- No new dependencies -- pure CSS/JS
- Favicon loading uses Google's public API with graceful fallback
- Data export creates downloadable JSON blob
- Sparklines use tiny inline `<canvas>` elements (50x20px)
- Breathing exercise is pure CSS animation (no JS timer needed for the visual)

