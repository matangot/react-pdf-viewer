# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.8] - 2026-03-09

### Fixed

- Fix printing on mobile (iOS) — pages were merged onto a single sheet because iframe printing doesn't support page breaks on iOS WebKit; mobile now opens a new window for reliable multi-page printing
- Fix blank pages when printing for the first time — wait for pdf.js render completion (data-rendered attribute) instead of checking canvas dimensions which resolved before content was painted

## [0.1.7] - 2026-03-08

### Fixed

- Fix document properties modal covering only the component area instead of the full screen
- Fix dropdown menu getting cut off when the component is shorter than the menu — constrain max-height to available space and scroll
- Fix Ctrl/Cmd+F not opening the search panel — dispatch custom event to open and focus search
- Disable fullscreen button when Fullscreen API is not available (e.g. iOS browsers)
- Fix inconsistent fullscreen icon between toolbar and menu
- Fix sidebar thumbnails going blank when reopening — clear rendered state on close so thumbnails re-render with fresh canvas elements

## [0.1.6] - 2026-03-08

### Fixed

- Fix pages not rendering in dual page view mode — replaced IntersectionObserver-based virtualization with scroll-based visibility detection for reliable page loading across all devices
- Fix pinch-to-zoom flash on release, gray gaps when zooming out, and blank pages at maximum zoom on mobile
- Fix canvas exceeding mobile browser pixel limits at high zoom levels by capping canvas resolution
- Fix "Last Page" navigation on mobile not reaching the actual last page — flex-shrink on the pages content wrapper allowed the scroll area to be compressed on mobile, clamping scroll position short of the target
- Fix current page indicator not updating when scrolling in dual page mode — re-query page wrappers on each scroll event to include virtualized pages, and use 2D area overlap so horizontal scrolling within a pair correctly tracks the visible page

## [0.1.5] - 2025-05-20

Initial tracked release.
