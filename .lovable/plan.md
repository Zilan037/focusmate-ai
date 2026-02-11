

# FocusGuard Chrome Extension — Full Build Plan

I'll create the entire Chrome extension inside an `extension/` folder in your project. You'll download it from GitHub, go to `chrome://extensions`, enable Developer Mode, click "Load unpacked", and point it to the `extension/` folder.

## Folder Structure

```text
extension/
  manifest.json              -- Manifest V3 config
  background.js              -- Service worker (tracking engine, focus timer, blocking)
  content.js                 -- Content script (overlay widget, block page injection)
  popup/
    popup.html               -- Extension popup UI
    popup.css                -- Popup styles
    popup.js                 -- Popup logic (stats, quick actions)
  dashboard/
    dashboard.html            -- Full dashboard page (opens in new tab)
    dashboard.css             -- Dashboard styles
    dashboard.js              -- Dashboard charts & logic
  blocked/
    blocked.html              -- Blocked site page (redirect target)
    blocked.css               -- Block page styles
    blocked.js                -- Block page logic (unlock tasks, timer, reflection)
  utils/
    storage.js                -- chrome.storage helpers
    categories.js             -- Domain categorization engine
    scoring.js                -- Productivity scoring algorithm
    insights.js               -- Behavioral insights generator
  icons/
    icon16.png
    icon48.png
    icon128.png
  assets/
    styles-common.css          -- Shared styles
```

## What Each File Does

### 1. manifest.json (Manifest V3)
- Permissions: `tabs`, `activeTab`, `storage`, `alarms`, `webNavigation`, `declarativeNetRequest`
- Background service worker registration
- Content script injection on all URLs
- Dashboard and blocked page as extension pages

### 2. background.js — Tracking + Focus + Blocking Engine
- **Smart Tracking**: Listens to `chrome.tabs.onActivated`, `chrome.tabs.onUpdated`, `chrome.windows.onFocusChanged`, and `chrome.idle.onStateChanged`
- **5-minute threshold**: Only commits sessions >= 5 minutes
- **Idle detection**: Pauses tracking after 60 seconds idle
- **Distraction loop detection**: Monitors rapid domain switches (4+ domains in 10 minutes with repeated returns)
- **Focus Mode timer**: Uses `chrome.alarms` for countdown
- **Domain blocking**: Uses `chrome.declarativeNetRequest` to redirect blocked domains to `blocked.html`
- **Daily limit enforcement**: Tracks per-domain time and blocks when limit is reached
- **Scheduled blocks**: Checks time-based block rules
- **Data structure**: Stores `DailyUsage` objects keyed by date in `chrome.storage.local`

### 3. content.js — Floating Productivity Widget
- Injects a small floating widget on every page showing:
  - Current domain time today
  - Total active time today
  - Focus timer (if active)
  - Quick block button
- Auto-hides during focus mode
- Draggable positioning

### 4. popup/ — Extension Popup
- Shows today's stats: active time, focus %, productivity score, streak
- Quick actions: Start Focus Mode, Open Dashboard, Quick Block current site
- Mini domain usage bars (top 5)
- Focus mode controls (duration selector, start/stop)

### 5. dashboard/ — Full Analytics Dashboard
- Opens in a new tab (chrome-extension:// page)
- **Today's Overview**: Cards with active time, focus %, score, streak
- **Domain Usage**: Bar chart (built with Canvas API, no external libs)
- **Category Breakdown**: Pie/donut chart
- **Hourly Activity**: Stacked bar chart showing productive vs distracted
- **Weekly Trends**: 7-day comparison bars
- **Behavioral Insights**: Auto-generated insight cards
- **Focus Sessions Log**: Table of completed sessions
- **Distraction Loop Alerts**: Flagged loop events
- **Settings panel**: Block list management, focus mode preferences, daily limits, scheduled blocks

### 6. blocked/ — Block Page with Task-Based Unlock
- Shows when user visits a blocked domain
- Displays: site name, reason for block, motivational quote
- **Task-Based Unlock Mode**:
  - Progress bar with requirements (focus X min, complete Y tasks, fewer than Z interruptions)
  - Task checklist
  - Focus streak display
  - Countdown timer
- **Override option**: Type reason + 15-second reflection timer
- Unlock validation logic matching your spec

### 7. utils/categories.js — Domain Categorization
- Auto-categorizes domains into: Social Media, Education, Entertainment, Work, News, Shopping, Other
- Pattern-matching with keyword lists (e.g., youtube/netflix/twitch = Entertainment)
- User can override categories in settings

### 8. utils/scoring.js — Productivity Scoring
- Weighted formula from your spec:
  - Education time x 2
  - Focus time x 2  
  - Work time x 1.5
  - Social media x -1.8
  - Block bypass attempts x -3
- Normalized to 0-100

### 9. utils/insights.js — Behavioral Insights Engine
- Time-of-day grouping analysis
- Ratio comparison (e.g., "YouTube = 62% of entertainment")
- Trend detection across days
- Generates text-based insight cards

## Technical Details

- Pure vanilla JavaScript (no frameworks, no build step needed)
- All CSS is custom (dark theme matching the web dashboard aesthetic)
- Canvas API for charts in the dashboard (no external chart libraries)
- All data stored in `chrome.storage.local` (privacy-first, local-only)
- Event-driven architecture — no polling, uses Chrome event listeners
- Service worker lifecycle handled properly for Manifest V3

## How to Use After Download

1. Download/clone the repo from GitHub
2. Open Chrome, go to `chrome://extensions`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `extension/` folder
6. The extension icon appears in your toolbar — you're live

