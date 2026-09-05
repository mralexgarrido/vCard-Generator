# vCard & Event QR Code Generator

[![CI](https://github.com/mralexgarrido/vCard-Generator/actions/workflows/ci.yml/badge.svg)](https://github.com/mralexgarrido/vCard-Generator/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/mralexgarrido/vCard-Generator/actions/workflows/pages.yml/badge.svg)](https://github.com/mralexgarrido/vCard-Generator/actions/workflows/pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)

A free, browser-first studio for contact cards and calendar invitations. No accounts, subscriptions, tracking, backend, or runtime API keys.

[Open the live generator](https://mralexgarrido.github.io/vCard-Generator/) · [Report an issue](https://github.com/mralexgarrido/vCard-Generator/issues) · [Project updates](docs/PROJECT-UPDATES.md) · [Release checklist](docs/RELEASE-CHECKLIST.md)

![vCard and event QR code generator](public/social-card.png)

## Why keep it around?

- **A guided creation loop.** Add details, validate, then export or share. Milestones reflect actions, not invented scores. No extra personal information is required to complete a card.
- **Automatic recovery.** Contact and event drafts save after a short typing pause and when the page is hidden. Return in the same browser to continue.
- **A personal shelf.** Keep up to 12 named contacts or events. Open, rename, remove, or reuse a saved item as a template. Event templates get fresh calendar identities.
- **Useful in person.** Present an enlarged QR in an accessible dialog, or print a clean card without the editor.
- **Useful on the same phone.** Share or download VCF/ICS files. Native file sharing is feature-detected, with a download fallback.
- **Designed exports.** Download a contact card or event invitation with readable details and a QR as a 1080 × 1400 PNG. Plain QR PNGs are available at 600, 1200, and 2400 px; SVG remains available for print.
- **Better event setup.** Meeting, workshop, and celebration presets set duration and reminders without replacing your written details. The preview shows dates, timezone, elapsed duration, and a countdown for timed events.
- **Import locally.** Load common fields from VCF or ICS files without uploading them. Import and replacement actions offer Undo.
- **Reliable boundaries.** Large, valid VCF/ICS files remain downloadable even when the information exceeds QR capacity. High-contrast colors, QR resilience options, and white quiet zones are preserved.

## Use the app

1. Choose **Contact card** or **Calendar event**. Enter a name, organization, or event details. Optional address and notes are tucked away until needed.
2. Watch the preview and resolve any validation message. For a calendar event, verify the selected timezone, dates, and duration.
3. Use **Share contact/event file** or download VCF/ICS for direct saving. Use **Present QR** for someone scanning your screen.
4. Download a designed card, QR PNG, or SVG, or choose **Print card**. Test the actual output before distribution.
5. Open **Your saved cards and events** to keep a named copy. The current draft autosaves separately; it needs no Save button.

To recommend the app, choose **Share this tool**. It shares only the generator address, never the current contact or event details.

## Privacy and local storage

Details are processed in the browser. The app has no account system, analytics, server-side storage, or background network calls. Sharing a file explicitly hands it to the operating system's selected sharing destination.

The current workspace uses `vcard-qr-generator:workspace:v1`. The named shelf uses `vcard-qr-generator:library:v1`. Storage is schema-checked, size-limited, and fails gracefully when unavailable.

**Browser memory > Forget saved data** removes both keys, clears the editor and Undo state, and cancels pending autosaves. Other apps' storage keys are not touched. Other open tabs receiving the removal event stop their pending save and reset their draft. This is not live multi-tab collaboration; simultaneous independent edits are last-write-wins.

Browser storage is not encrypted by this app. Storage is scoped to the browser profile and web origin, not a private user account. Other applications on the same origin may have access to that origin's storage. Do not use a shared browser for sensitive contact information. Clearing site data, using private browsing, switching profiles/devices, or browser eviction can remove saved data. Export VCF/ICS for a portable backup. Forgetting browser data cannot retract downloaded files, printed codes, or shared messages.

## Compatibility and limitations

- Contact output: vCard 3.0. Event output: iCalendar 2.0. UTF-8 lines are folded, text is escaped, and files use CRLF endings.
- Timed events use the chosen IANA timezone and export UTC. All-day end dates are inclusive in the editor and exclusive in the ICS output.
- Imports load one entry and common fields. Repeating schedules, attendees, attachments, and advanced vendor-specific properties are not supported. Keep the original file when these matter.
- Static QR codes contain the data directly. They have no app-imposed expiration, but they do not update after printing. Regenerate a code when details change.
- Camera recognition, file handling, printing, and native sharing vary by browser and operating system. Test on real iOS and Android devices. A browser share promise is not proof of delivery to a recipient.
- Long text may be shortened on the designed image to preserve its layout; the underlying QR and source file keep the full entered data.
- Hosted contact URLs, analytics, cloud syncing, recurring events, and backend services are outside the current feature set.

## Run locally

Requires Node.js 20 or newer and npm. Use the committed lockfile and the runtime specified by `.nvmrc` when reproducing CI.

```bash
git clone https://github.com/mralexgarrido/vCard-Generator.git
cd vCard-Generator
npm ci
npm run dev
```

### Quality checks

```bash
npm run check
```

This runs TypeScript checking, unit tests, and a production build. Tests cover formats and import behavior, storage and cleanup, large source-file exports, event presets and timezones, safe SVG text, and server-rendered UI contracts.

### Review a pull request without deploying

Features described on a feature branch are not live until that branch is approved, merged, and deployed.

CI verifies the GitHub Pages subpath build and then creates a relative-path `vcard-review-build` artifact. In **Actions > CI > the run > Artifacts**, download and unzip it, then serve the folder locally:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Do not double-click the HTML file; module loading needs an HTTP server. Artifacts are retained for seven days. An artifact is not a hosted preview URL.

## Architecture

| Area | Implementation |
| --- | --- |
| Interface | React 19 and TypeScript |
| Build | Vite, npm, committed package-lock.json |
| Styling | Compiled Tailwind CSS and system fonts |
| QR rendering | react-qr-code, memoized and deferred during typing |
| Event editor | Loaded on first use |
| Designed export renderer | Loaded only when requested; local SVG-to-canvas |
| Drafts and saved shelf | Versioned, app-prefixed localStorage keys |
| Hosting | Existing GitHub Pages via GitHub Actions |

QR rendering is separated from urgent typing updates, exports are disabled while the preview is stale, and the event editor and artwork generator are split into separate chunks. These implementation choices are not claims of a measured speedup.

## Project updates

See [Project updates](docs/PROJECT-UPDATES.md) for the reviewed upgrade history, release-note guidance, and repository presentation handoff. [GitHub Releases](https://github.com/mralexgarrido/vCard-Generator/releases) contains announcements when published. A package version, merged feature, and successful deployment are related but distinct records.

## Deployment and rollback

The production workflow is `.github/workflows/pages.yml`. It runs after a commit reaches `main` or an explicit manual run. The application uses GitHub Pages; no hosting migration is part of this documentation update.

For a fork, open **Settings > Pages > Build and deployment**, and choose **GitHub Actions**. The workflow derives the repository subpath automatically.

Before a production merge, complete [the release checklist](docs/RELEASE-CHECKLIST.md) and record the current known-good commit. Roll back through a normal revert pull request and the existing Pages workflow. Do not clear users' local data as part of rollback. Historical upgrade-specific rollback notes are preserved in [Project updates](docs/PROJECT-UPDATES.md).

## Standards and implementation references

- Dawson, F., & Howes, T. (1998). *A MIME content-type for directory information* (RFC 2425). IETF. https://www.rfc-editor.org/rfc/rfc2425
- Dawson, F., & Howes, T. (1998). *vCard MIME directory profile* (RFC 2426). IETF. https://www.rfc-editor.org/rfc/rfc2426
- Desruisseaux, B. (2009). *Internet calendaring and scheduling core object specification* (RFC 5545). IETF. https://www.rfc-editor.org/rfc/rfc5545
- React. (n.d.). *useDeferredValue*. https://react.dev/reference/react/useDeferredValue
- MDN contributors. (n.d.). *Navigator: share() method*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

## Contributing and license

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing focused changes. Report security concerns according to [SECURITY.md](SECURITY.md). Released under the [MIT License](LICENSE).
