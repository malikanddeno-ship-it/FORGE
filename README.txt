FORGE // OVERDRIVE v3
=====================

THE APP IS STILL SIMPLE TO USE
------------------------------
Open FORGE -> get exactly 5 daily quests -> play VALORANT or VRFS -> clip the quest -> attach proof -> earn XP.

There is still NO manual stat entry, NO session logging, NO public account system, and NO other games.
Everything outside the five-quest loop is automatic progression, history, collection, or analytics built from clipped quests.

OVERDRIVE UPDATE
----------------
- 3,000 quest templates total
  - 1,500 VALORANT templates
  - 1,500 VRFS templates
- Deterministic private daily generation
- Game mix controls: balanced, VAL-heavy, VRFS-heavy, wild
- Difficulty bias: mixed, chill, harder
- Quest category diversity to reduce same-feeling boards
- Rarity, difficulty, category, proof hints and XP on quests
- Highest-XP daily quest receives a featured/boss presentation
- One reroll before the first proof is submitted
- Exactly five quests every day

PROOF / CLIPS
-------------
- Video OR screenshot proof
- Proof file required to complete a quest
- Local IndexedDB media storage
- Built-in clip viewer
- Search clips
- Filter by VALORANT / VRFS
- Newest / oldest / favorite sorting
- Favorite clips
- File-size display
- Storage-persistence request when supported
- Deleting proof rolls back that quest XP and a perfect-day bonus if necessary

PROGRESSION
-----------
- Account XP and variable level curve
- 100 level rewards
- Titles
- Accent colors
- Frames
- Marks/badges
- Equipable cosmetics
- Prestige count every 50 levels
- FORGE Score and career ranks
- VALORANT mastery
- VRFS mastery
- Perfect-board +250 XP bonus
- Current and longest daily streaks
- Level-up animation
- Achievement unlock notifications

ACHIEVEMENTS
------------
- Quest-count milestones
- Perfect-day milestones
- Streak milestones
- VALORANT-specific milestones
- VRFS-specific milestones
- Level milestones
- Automatic only: no claim buttons

HISTORY / ANALYTICS
-------------------
- Every generated daily board is archived
- Filter perfect vs partial days
- Open proof from history when available
- VALORANT vs VRFS donut chart
- 30-day output chart
- Completed-quest difficulty breakdown
- Quest-category breakdown
- 90-day activity calendar
- 14-day progression heat strip
- No manual analytics input

UI / EXPERIENCE
---------------
- Entirely redesigned modern dark UI
- Light mode
- User-selectable accent colors through progression
- Glass panels and animated aurora background
- Animated daily progress ring and bars
- Hover depth / card tilt on pointer devices
- Reveal animations
- Confetti for completions and perfect boards
- Level-up screen
- Optional generated UI sounds (no audio files)
- Motion toggle
- Reduced-motion support
- Responsive desktop/tablet/mobile layouts
- Bottom mobile navigation
- Ctrl/Cmd + K command palette
- Offline PWA support on localhost/HTTPS

DATA / COMPATIBILITY
--------------------
- Keeps the old localStorage key: forge_daily_v2
- Keeps the old clip database: forge_daily_clips
- Automatically migrates old v2 quest boards with missing v3 fields
- JSON backup/export of progression + clip metadata
- Import supports the v2/v3 state structure
- Actual video/image blobs are intentionally NOT placed in JSON backups

RUN IT
------
Fast:
Open index.html directly.

Best on Windows:
Double-click launch.bat.
It opens http://localhost:8080 and enables the PWA/offline worker.

GITDROP / GITHUB PAGES
----------------------
The project files are directly at the root of the ZIP. There is no extra outer folder required.
Upload/update the repository with the ZIP contents and serve index.html.

IMPORTANT STORAGE NOTE
----------------------
Video clips can be large. Browser storage limits vary by device/browser. Short trimmed proof clips are best.
