
I will implement the requested fixes and features in the following order:

1.  **Enhance Categories & Blocking Logic (`extension/utils/categories.js`, `extension/background.js`)**
    *   **New Categories:** Add "Adult" and "Gambling" categories with comprehensive domain lists and keywords.
    *   **Focus Mode Logic:** Update `startFocusMode` to accept `allowedSites` (whitelist) and `blockedSites` (blacklist).
    *   **Blocking Engine:** Rewrite `checkBlocking` in `background.js` to strictly enforce the new Focus Mode rules:
        *   **Whitelist Mode:** If user adds *any* site to "Allow Only", block *everything* else.
        *   **Blacklist Mode:** If "Allow Only" is empty, block sites in "Block Sites" + standard distractions + (optionally) Adult/Gambling.
    *   **Bulk Actions:** Implement `toggleAllBlockedDomains` to correctly enable/disable all items in the blocklist.

2.  **Upgrade Dashboard Charts & UX (`extension/dashboard/dashboard.js`)**
    *   **Fix Overlapping Labels (SS1):** Update `drawWeeklyChart` and other chart functions to handle varying screen widths better (skip labels if space is tight) and ensure charts redraw when the tab becomes visible (fixing the 0-width issue).
    *   **Focus Mode Deployment:** Update `deployFocus` to collect the user-defined Block/Allow lists and send them to the background worker.
    *   **Quick Add Blocklist:** Implement the logic for the "Enable All" / "Disable All" buttons.

3.  **UI Enhancements (`extension/dashboard/dashboard.html`)**
    *   **Quick Add Categories:** Add a new section in the Blocklist tab to quickly block entire categories (Social, Adult, Gambling) from history/defaults.

4.  **Refine Blocking Page & Feedback**
    *   Ensure the blocked page clearly communicates *why* a site is blocked (e.g., "Not in Allowed List" vs "Focus Mode Distraction").

This approach ensures the "Allow Only" strict mode works as requested, fixes the visual bugs in the dashboard, and adds the requested safety categories.
