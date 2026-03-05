# Documentation Website Design

## Overview

Single-page showcase site for @matangot/react-pdf-viewer. Dark/modern style with live demo, feature highlights, and code examples. Deployed to GitHub Pages.

## Layout (top to bottom)

1. **Nav bar** — Package name, GitHub link, npm link
2. **Hero** — Tagline, short description, install command with copy button
3. **Live demo** — Full current demo embedded, bordered with subtle glow
4. **Features grid** — 6-8 cards: navigation, zoom, search, thumbnails, theming, print/download, keyboard shortcuts, compound components
5. **Code examples** — Two blocks: "Quick Start" (simple PdfViewer) and "Compound Components" (custom layout)
6. **Footer** — MIT license, GitHub link, npm link

## Style

- Dark background (#0a0a0b)
- Gradient text for headline
- Subtle glow/border effects on demo and cards
- Monospace code blocks with syntax highlighting
- System font stack for body text

## Technical

- Vite static build in `docs-site/` directory
- React (reuses the library source)
- GitHub Actions workflow `.github/workflows/docs.yml`
- Deploys to GitHub Pages on push to master
- Separate from existing `demo/` dev playground

## URL

matangot.github.io/react-pdf-viewer
