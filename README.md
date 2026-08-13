# FORGE // OVERDRIVE v4

A local-first daily quest app for **VRFS + VALORANT only**.

## Open
Extract the ZIP and open `index.html` in a browser. For installable/offline PWA behavior, serve the folder from any simple local/static web server; the app itself still works from `file://` and simulates offline progression from timestamps.

## Core loop
- Forge automatically rolls **5 daily quests** using both VRFS and VALORANT.
- Complete the task in-game, attach a video/image proof clip, and Forge awards XP, Sparks, mastery, streak progression, achievements, titles, and themes.
- No session tracking, manual stat entry, or playtime logging.

## Living/background behavior
A normal browser page cannot truly execute continuously after it is fully closed. Forge v4 handles this correctly by storing timestamps and calculating what happened while it was away when it opens again: Core Heat growth, live-event rotations, and daily-board rollover. While the app is open, its Pulse engine updates continuously.

## v4 highlights
Opening boot animation, ambient particles, animated core, While You Were Away report, 30-minute live events, passive Core Heat, deterministic daily boards, Boss Quest, IndexedDB proof library/player, long-term XP/mastery, achievements, titles, themes, archive, export/import, responsive mobile UI, and offline/PWA cache support when served over HTTP(S).
