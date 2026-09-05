# Project updates

## Find the change history

[Reviewed pull requests](https://github.com/mralexgarrido/vCard-Generator/pulls?q=is%3Apr+is%3Amerged) record the changes merged into this repository. [GitHub Releases](https://github.com/mralexgarrido/vCard-Generator/releases) contains announcements when published. Verify a deployment's commit separately before saying a feature is live.

The current package declares version 1.2.0. That value does not, by itself, establish that a matching GitHub release or tag has been published. This documentation does not create a release, alter the package version, or regenerate exported files.

## Guided studio upgrade history

[PR #11](https://github.com/mralexgarrido/vCard-Generator/pull/11) was merged as commit `6c6ada3e0ea029e1e3319647ac39760775c3d343`. Its commit message records the approved browser-autosave foundation, saved library, creation progress, event presets/countdowns, designed exports, QR presentation, printing, and native sharing.

A reader-facing announcement for that reviewed change can focus on the practical outcome: **Return to unfinished cards, reuse saved contacts and events, and choose an export that fits the way you plan to share.** Confirm the exact deployed commit and known limitations before publishing the announcement.

### Historical implementation and rollback context

The upgrade built on `feat/browser-draft-autosave`, PR #10, head `cde3f25d7f6b0620191ae628a8c33e51d940a909`, and was reviewed at head `13d7e7868ddfdcdd7ea67d9361d488c12a6f3c96`. The recorded pre-upgrade rollback base was `26f2f77f597638edf39884a7ca3ecbae6dd13534`.

The earlier implementation notes state that the upgrade retained runtime dependencies and removed full-page blur effects. They also record compatibility of the legacy workspace key and that the older app ignores the additional shelf key. These are historical notes, not a universal rollback guarantee for future versions. Preserve saved user data and review compatibility for the exact proposed rollback.

## Maintainer handoff

Use the [release checklist](RELEASE-CHECKLIST.md), not a one-time feature-branch instruction, for each proposed change. Record the exact commit, actual validation results, storage/export implications, and rollback point. Publish releases or deploy only after maintainer approval.

Suggested About description: **Create contact cards, calendar invitations, and QR codes with browser-based VCF, ICS, PNG, and SVG exports.** Suggested topics: `vcard`, `icalendar`, `qr-code`, `contact-card`, `react`, `typescript`, `github-pages`.

The About website should use the verified public generator URL. Use an actual app screenshot or approved product graphic for a repository social preview. These settings are separate from README content and website metadata; this document does not configure them.

## Share the tool, not private details

The application's **Share this tool** action is intended to share the generator address, not a contact/event payload. Use fictional information in screenshots, sample files, issues, and release artwork. Export a VCF or ICS as a portable backup when preserving data matters; a saved browser draft is not cloud sync.
