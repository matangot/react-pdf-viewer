# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.1.6] - 2026-03-08

### Fixed

- Fix pages not rendering in dual page view mode — replaced IntersectionObserver-based virtualization with scroll-based visibility detection for reliable page loading across all devices
- Fix pinch-to-zoom flash on release, gray gaps when zooming out, and blank pages at maximum zoom on mobile
- Fix canvas exceeding mobile browser pixel limits at high zoom levels by capping canvas resolution
- Fix "Last Page" navigation on mobile not reaching the actual last page — flex-shrink on the pages content wrapper allowed the scroll area to be compressed on mobile, clamping scroll position short of the target
- Fix current page indicator not updating when scrolling in dual page mode — re-query page wrappers on each scroll event to include virtualized pages, and use 2D area overlap so horizontal scrolling within a pair correctly tracks the visible page

## [0.1.5] - 2025-05-20

Initial tracked release.
