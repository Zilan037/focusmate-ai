

# FocusGuard Complete Overhaul -- Landing, Focus Mode, Extension Fixes & Polish

---

## Issue 1: Onboarding CSP Fix (Critical)

The `onclick="..."` inline event handlers in `onboarding.html` and `blocked.html` still violate Chrome's Content Security Policy. The `<script src>` fix only solved the inline `<script>` block -- but every `onclick`, `onchange` attribute is also blocked.

**Fix**: Remove ALL inline event handlers from both `onboarding.html` and `blocked.html`. Replace with `addEventListener` calls in their respective `.js` files.

**Files:**
- `extension/onboarding/onboarding.html` -- Remove all `onclick="..."` attributes, add `id` attributes instead
- `extension/onboarding/onboarding.js` -- Add `addEventListener` for all buttons/interactions at `DOMContentLoaded`
- `extension/blocked/blocked.html` -- Same treatment for override buttons
- `extension/blocked/blocked.js` -- Add `addEventListener` bindings

---

## Issue 2: Dashboard Sidebar Expand/Collapse Fix

The collapse button toggles a CSS class but there is no way to expand again once collapsed since the brand text and labels are hidden.

**Fix**: Ensure the collapse button remains visible and clickable in collapsed state. Add a tooltip-trigger or keep the hamburger icon accessible.

**File:** `extension/dashboard/dashboard.js` -- Update the `btn-collapse` handler to properly toggle and ensure the button stays reachable in collapsed mode.

---

## Issue 3: Landing Page Premium Redesign

Complete rewrite of `Landing.tsx` to match the extension dashboard's premium aesthetic (Plus Jakarta Sans, slate colors, 28px card radii, uppercase tracking labels, gradient accents).

**New sections with populated data:**

1. **Hero** -- "Neural Monitoring" badge, large title with gradient, subtitle with description, CTA buttons (Add to Chrome, View Dashboard, Try Focus Mode)

2. **Live Dashboard Preview** -- A mock dashboard card showing populated stats: Score 87, Active 6.5h, Streak 12 days, 4 focus sessions. Styled exactly like the extension's metric cards with sparkline placeholders.

3. **Core Features Grid** (6 cards) -- Same features but with premium-card styling (28px radius, hover lift, icon in gradient circle, uppercase label, description)

4. **Focus Mode Showcase** -- Interactive demo preview showing timer UI, task list, blocked sites, unlock requirements -- all with populated mock data. Shows what a running focus session looks like.

5. **Analytics Preview** -- Mock charts section showing weekly trends bar chart (using recharts), category donut, domain usage bars -- all with real populated data from mockData.ts

6. **Blocked Page Preview** -- Shows the blocked page experience with shield icon, domain pill, reflection timer

7. **How It Works** (4 steps) -- Premium step cards with numbered sequence

8. **Comparison Table** -- FocusGuard vs Others with check/X marks

9. **Tech and Privacy** (4 cards) -- Event-driven, no keystroke logging, local-first, transparent

10. **Footer** -- Premium footer matching extension branding

**Files:**
- `src/pages/Landing.tsx` -- Complete rewrite
- `src/index.css` -- Add Plus Jakarta Sans import, update font-family to match extension

---

## Issue 4: Focus Mode Transformation

Complete rewrite of `FocusMode.tsx` to add:

**Pre-Focus Setup Phase:**
- Task input field (add/remove tasks dynamically)
- Block websites input (add domains to block during session)
- Allow websites input (whitelist-only mode: only these sites accessible)
- Duration selector (15m, 25m, 45m, 60m pill buttons)
- "Deploy Focus" button to start

**Active Focus Phase:**
- Large timer display (mono font, gradient glow)
- Progress ring around timer
- Task checklist with completion tracking
- Blocked sites list display
- Allowed sites list display
- Pause/Stop buttons
- Session stats (elapsed, tasks done, interruptions)
- Motivational quote

**Blocked Site Overlay (when visiting blocked URL during focus):**
- Full-screen overlay matching the extension's blocked page design
- Shield icon with animated ring
- "Site Blocked" title with domain pill
- Resist counter
- Reflection timer
- Quote card
- "Go Back" button
- This is simulated in the web app since we can't actually block -- it shows as a demo overlay when user clicks "Try visiting a blocked site" button

**Unlock System:**
- Progress bars for focus time, tasks completed, interruptions
- Celebration animation when all requirements met

**Files:**
- `src/pages/FocusMode.tsx` -- Complete rewrite with all phases

---

## Issue 5: Content.js Overlay Enhancement

Upgrade the floating widget for active focus mode:

- When focus is active: bubble glows with pulsing animation, shows countdown timer text on bubble
- Expanded view shows: countdown timer, task checklist with checkboxes, completion count
- Add "Allowed Sites" indicator when in whitelist mode
- Theme-aware styling using Plus Jakarta Sans

**File:** `extension/content.js` -- Enhanced focus mode display

---

## Issue 6: Extension Dashboard UX Improvements

- Increase all font sizes by 1-2px across all sections
- Make settings inputs larger and more touch-friendly
- Add empty state messages with icons for sections with no data
- Improve blocklist item cards with better spacing
- Make chart cards more readable with larger axis labels
- Add hover tooltips on metric cards showing detail
- Ensure all tabs animate smoothly on switch

**Files:**
- `extension/dashboard/dashboard.css` -- Font size and spacing tweaks
- `extension/dashboard/dashboard.js` -- Empty states, UX improvements

---

## Issue 7: Website Dashboard Page Update

Update `Dashboard.tsx` to match the premium aesthetic:
- Use Plus Jakarta Sans
- Premium card styling (28px radius, hover lift)
- Uppercase tracking labels on all stat cards
- Larger bold values with mono font
- Better chart styling with gradient fills
- Match the dark slate color scheme

**File:** `src/pages/Dashboard.tsx` -- Styling update

---

## Issue 8: Navbar Update

Update `Navbar.tsx` with premium styling:
- Glassmorphic navbar with Plus Jakarta Sans
- Status indicator ("Neural Monitoring Active" with pulsing dot)
- Better active state styling
- Streak badge in navbar

**File:** `src/components/Navbar.tsx` -- Premium update

---

## Implementation Order

1. `src/index.css` -- Add Plus Jakarta Sans, update design tokens
2. `tailwind.config.ts` -- Add Plus Jakarta Sans to font family
3. `src/components/Navbar.tsx` -- Premium navbar
4. `src/pages/Landing.tsx` -- Complete premium landing with populated data
5. `src/pages/FocusMode.tsx` -- Full focus mode with setup, active, blocked overlay
6. `src/pages/Dashboard.tsx` -- Premium dashboard styling
7. `extension/onboarding/onboarding.html` + `onboarding.js` -- Remove inline handlers, fix CSP
8. `extension/blocked/blocked.html` + `blocked.js` -- Remove inline handlers
9. `extension/dashboard/dashboard.js` -- Sidebar expand fix, UX improvements
10. `extension/dashboard/dashboard.css` -- Font size and spacing tweaks
11. `extension/content.js` -- Enhanced focus overlay with timer and tasks

---

## Technical Notes

- All website pages (Landing, Focus, Dashboard) use React + Tailwind + Framer Motion + Recharts
- Extension files use vanilla JS/CSS/HTML
- Mock data from `src/data/mockData.ts` is used for populated dashboard previews on landing
- Focus Mode blocked overlay is a simulated demo (not actual browser blocking)
- The "allowed websites" feature stores a whitelist array in focus session state
- No new dependencies needed

