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
| `hobbies.css` — photo band + lightbox | `counters.js` — achievement count-up |
| `reveal.css` — `.fx` entrance/scroll reveal | `lang.js` — language toggle |
| `game.css` | `gallery.js` — photo band + lightbox |
| `responsive.css` — media queries + reduced motion | `game.js`, `portrait.js` |

Sections share `css/sections.css` rather than getting a file each — the per-section blocks are ~10 lines apiece and are marked with comment banners inside.

## Architecture

### Bilingual content (critical invariant)

Every visible string exists twice in `index.html`: an English element with class `.l-en` and a German sibling with `.l-de`. CSS on `<body class="lang-en|lang-de">` hides the inactive language; the toggle in `js/lang.js` swaps the body class. **Any content edit must update both variants** — an element missing its counterpart silently disappears in one language. Larger blocks (timeline jobs, project cards, skill categories) are duplicated as whole sibling elements rather than per-string spans.

**One exception: images are never duplicated.** The invariant covers visible *strings*, not binary assets. The photo band in `#hobbies` has a single set of `<img>` tags and carries no visible text at all — captions were removed, so there is nothing there to translate. Duplicating the band per language would make the browser fetch every photo twice for no benefit. `alt` stays English; if the band ever regains captions, they take `.l-en`/`.l-de` spans while the `<img>` tags stay single.

### Progressive enhancement

- An inline script adds `.fx` to `<html>`; all entrance/reveal animations are gated behind `.fx`, so content stays visible with JS off.
- `prefers-reduced-motion` disables the loader, cursor glow, counters, and all reveals (in `css/responsive.css`, and via the `reduceMotion` check from `js/core.js`).
- `REVEAL_SEL` in `js/core.js` must stay in sync with the selector list in **three** places, not two: `js/core.js`, `css/reveal.css`, and the reduced-motion override in `css/responsive.css`. Adding a new section that should animate in requires updating all three — miss the third and that section stays at `opacity:0` forever for reduced-motion users.

### Photos

Camera originals live in `photos-src/` and are **gitignored** — only the generated derivatives in `img/` are committed (currently 27 photos: 788 KB of thumbs, 4.7 MB of full-size, from 143 MB of originals). `python tools/build-photos.py` (needs Pillow) writes two WebP files per photo: `img/thumb/` at 640px for the band tiles, `img/full/` at 1600px for the lightbox. It renames to `photo-NN` in sorted order, reports unreadable and low-resolution files instead of dying on them, and skips RAW — Pillow can't read `.DNG`.

Other flags: `--emit-html` prints the `<figure>` block for every photo, to paste into `.band` in `index.html` (numbering matches what the converter writes, so the two stay in step); `--placeholders N` generates stand-ins so the band renders with no photos present; `--selftest` checks the resize math.

Thumbs are sized to the band tile, not the viewport — that roughly halves the section's weight. `js/gallery.js` also stops its rAF loop when the section is off-screen, so a visitor who never scrolls there costs nothing.

**Four traps in `js/gallery.js` worth not re-introducing**, all found by testing rather than reading:

1. `scrollLeft += 0.4` silently rounds to zero every frame and the band never moves — accumulate in a float and assign.
2. The wrap distance is one tile *period*, not `scrollWidth / 2`, which lands half a flex gap short and hitches on every loop.
3. **Cloning the strip at load defeats `loading="lazy"`** — inserting the copies makes the browser fetch every thumb immediately, even with the band 5000px below the fold. The clones are built on first intersection instead. Verified by blocking `gallery.js`: 0 thumbs versus 27.
4. `<dialog>` returns focus to the tile that opened it, and closing with Esc marks that focus `:focus-visible`. Any "pause while focused" rule must therefore distinguish focus the user chose from focus the dialog handed back, or the band freezes for good once someone views a photo.

### Wavelength-coded palette

CSS custom properties `--w405/--w488/--w532/--w633` map laser wavelengths to accent colors (green `--w532` is primary). Project cards pick their accent via inline `style="--accent:var(--wXXX)"`.

### JS structure

Each `js/` file is a self-contained IIFE (except `core.js`, which is just the two globals). Nothing exports or imports; the only shared state is `reduceMotion` and `REVEAL_SEL` from `core.js`, and coordination happens through the DOM — `portrait.js` waits on `body.loaded` rather than calling into `loader.js`, and `game.js` attaches its own listeners to the language buttons rather than hooking `lang.js`. Keep it that way: a new feature should be a new file that reads the DOM, not a new global.
