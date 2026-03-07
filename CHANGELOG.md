# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

- Fix pages not rendering in dual page view mode — replaced IntersectionObserver-based virtualization with scroll-based visibility detection for reliable page loading across all devices
- Fix pinch-to-zoom flash on release, gray gaps when zooming out, and blank pages at maximum zoom on mobile
- Fix canvas exceeding mobile browser pixel limits at high zoom levels by capping canvas resolution
- Fix "Last Page" navigation on mobile not reaching the actual last page — flex-shrink on the pages content wrapper allowed the scroll area to be compressed on mobile, clamping scroll position short of the target

## [0.1.5] - 2025-05-20

Initial tracked release.
