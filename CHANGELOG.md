# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

- Fix pages not rendering in dual page view mode — replaced IntersectionObserver-based virtualization with scroll-based visibility detection for reliable page loading across all devices
- Fix "Last Page" navigation on mobile not reaching the actual last page — the IntersectionObserver was overriding the current page to the topmost visible page after programmatic navigation
- Fix npm publish workflow to use OIDC trusted publisher auth instead of `NODE_AUTH_TOKEN`

## [0.1.5] - 2025-05-20

Initial tracked release.
