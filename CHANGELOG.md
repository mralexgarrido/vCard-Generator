# Changelog

All notable changes to this project are documented here.

## [1.0.0] - 2026-09-03

### Added

- Generic contact and calendar event QR workflows
- PNG and SVG QR downloads with a white quiet zone
- VCF and ICS file downloads
- Timed and all-day calendar events
- Browser-detected, globally selectable time zones
- Validation, QR density guidance, and accessible form controls
- Automated tests, CI, and GitHub Pages deployment
- Project documentation and contribution guidance

### Changed

- Corrected vCard address structure, text escaping, CRLF endings, and UTF-8 line folding
- Made calendar UID and timestamp stable for each event
- Converted timed calendar events to UTC for cross-time-zone compatibility
- Removed institution-specific defaults, labels, examples, and branding
- Replaced runtime CDN styling with a compiled production stylesheet
