# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A single-page bilingual (EN/DE) portfolio site for Vivek Harikumar (laser & photonics). Pure static HTML/CSS/JS — no build step, no dependencies, no tests. To view, open `index.html` in a browser or serve the folder (e.g. `python -m http.server`).

Three files: `index.html` (all content), `styles.css`, `script.js`.

## Architecture

### Bilingual content (critical invariant)

Every visible string exists twice in `index.html`: an English element with class `.l-en` and a German sibling with `.l-de`. CSS on `<body class="lang-en|lang-de">` hides the inactive language; the toggle in `script.js` swaps the body class. **Any content edit must update both variants** — an element missing its counterpart silently disappears in one language. Larger blocks (timeline jobs, project cards, skill categories) are duplicated as whole sibling elements rather than per-string spans.

### Progressive enhancement

- An inline script adds `.fx` to `<html>`; all entrance/reveal animations are gated behind `.fx`, so content stays visible with JS off.
- `prefers-reduced-motion` disables the loader, cursor glow, counters, and all reveals (both in CSS and via the `reduceMotion` check in `script.js`).
- `REVEAL_SEL` at the top of `script.js` must stay in sync with the `.fx ...` selector list in `styles.css` (entrance/scroll-reveal section). Adding a new section that should animate in requires updating both.

### Wavelength-coded palette

CSS custom properties `--w405/--w488/--w532/--w633` map laser wavelengths to accent colors (green `--w532` is primary). Project cards pick their accent via inline `style="--accent:var(--wXXX)"`.

### script.js structure

Self-contained IIFEs, one per feature: loader, scroll progress + nav hairline, cursor glow, scroll reveal (IntersectionObserver), scrollspy, achievement count-up (locale-aware number formatting follows the active language), language toggle.
