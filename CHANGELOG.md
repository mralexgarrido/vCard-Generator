# Changelog

All notable changes to this project are documented here.

## [1.1.0] - 2026-09-03

### Added

- Local VCF and ICS import for editing common contact and event fields
- High-contrast QR color presets and selectable error-correction levels
- 600, 1200, and 2400 pixel PNG export sizes
- Copy-to-clipboard actions for vCard and calendar source data
- Quick event-duration controls and optional calendar reminders
- Mobile shortcuts between the form and QR output
- Undo after clearing contact or event fields
- Visible success and error feedback for imports, copies, and downloads

### Changed

- Event end times now preserve the existing duration when the start time changes
- QR validation now accounts for the capacity cost of stronger error correction

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
