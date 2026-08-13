# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page bilingual (EN/DE) portfolio site for Vivek Harikumar (laser & photonics). Pure static HTML/CSS/JS — no build step, no dependencies, no tests. To view, open `index.html` in a browser or serve the folder (e.g. `python -m http.server`).

`index.html` holds all content. CSS and JS are split one file per feature under `css/` and `js/`, wired up as plain `<link>` / `<script src>` tags at the top and bottom of `index.html`.

**Load order is the contract.** The `<link>` order is the cascade order (`base.css` first, `responsive.css` last); the `<script>` order puts `core.js` first because it defines the globals the others read. Adding a file means adding its tag in the right position. They are deliberately classic scripts, not ES modules — modules are blocked over `file://`, and opening `index.html` directly is a supported way to view the site.

| `css/` | `js/` |
|---|---|
| `base.css` — palette, resets, `.l-en`/`.l-de` toggle | `core.js` — `reduceMotion`, `REVEAL_SEL` globals |
| `loader.css` | `loader.js` |
| `nav.css` — cursor glow, scroll progress, nav | `nav.js` — hairline + scrollspy |
| `hero.css` | `cursor.js` — cursor glow |
| `sections.css` — about, timeline, projects, skills, achievements, contact | `reveal.js` — IntersectionObserver |
| `reveal.css` — `.fx` entrance/scroll reveal | `counters.js` — achievement count-up |
| `game.css` | `lang.js` — language toggle |
| `responsive.css` — media queries + reduced motion | `game.js`, `portrait.js` |

Sections share `css/sections.css` rather than getting a file each — the per-section blocks are ~10 lines apiece and are marked with comment banners inside.

## Architecture

### Bilingual content (critical invariant)

Every visible string exists twice in `index.html`: an English element with class `.l-en` and a German sibling with `.l-de`. CSS on `<body class="lang-en|lang-de">` hides the inactive language; the toggle in `js/lang.js` swaps the body class. **Any content edit must update both variants** — an element missing its counterpart silently disappears in one language. Larger blocks (timeline jobs, project cards, skill categories) are duplicated as whole sibling elements rather than per-string spans.

### Progressive enhancement

- An inline script adds `.fx` to `<html>`; all entrance/reveal animations are gated behind `.fx`, so content stays visible with JS off.
- `prefers-reduced-motion` disables the loader, cursor glow, counters, and all reveals (in `css/responsive.css`, and via the `reduceMotion` check from `js/core.js`).
- `REVEAL_SEL` in `js/core.js` must stay in sync with the selector list in `css/reveal.css`. Adding a new section that should animate in requires updating both.

### Wavelength-coded palette

CSS custom properties `--w405/--w488/--w532/--w633` map laser wavelengths to accent colors (green `--w532` is primary). Project cards pick their accent via inline `style="--accent:var(--wXXX)"`.

### JS structure

Each `js/` file is a self-contained IIFE (except `core.js`, which is just the two globals). Nothing exports or imports; the only shared state is `reduceMotion` and `REVEAL_SEL` from `core.js`, and coordination happens through the DOM — `portrait.js` waits on `body.loaded` rather than calling into `loader.js`, and `game.js` attaches its own listeners to the language buttons rather than hooking `lang.js`. Keep it that way: a new feature should be a new file that reads the DOM, not a new global.
