# Release checklist

Use this checklist for the exact proposed commit. A previous feature branch or historic rollback base is not automatically the correct reference for a new release. The launch-specific history is preserved in [Project updates](PROJECT-UPDATES.md).

## Scope and approval

Record the purpose, changed files, current main commit, and known-good deployment. Keep unrelated dependency, hosting, storage-schema, and interface changes separate. Obtain explicit maintainer approval before merging, deploying, or publishing a release/tag.

CI uploads a review artifact; it does not deploy that artifact as a preview site. Changes merged to main can trigger the existing Pages production workflow, including documentation-only changes.

## Automated checks

Run `npm ci` and `npm run check` with the declared runtime and committed lockfile. Verify the CI run for the exact review commit. CI must complete the production-subpath build and portable artifact build. Existing serialization/import/storage tests must remain green alongside experience tests.

Record checks actually performed. Automated checks do not prove that every phone will scan a printed code or that a native-share operation reached its recipient.

## Browser smoke tests before production

- [ ] At 320, 375, 768, and 1440 px: no horizontal overflow; all primary actions usable; editor and preview readable.
- [ ] Keyboard: skip link, arrow-key tab switching, optional field disclosure, form labels, visible focus, and return focus after closing Present QR with Escape.
- [ ] Create a name-only contact; then add an email/phone. Verify minimal information is enough and optional fields do not gate completion.
- [ ] Invalid email/URL disables file export. Large valid data disables only QR exports, not VCF/ICS.
- [ ] Type quickly and export immediately. Controls must not export an out-of-date preview.
- [ ] Reload after typing; hide/close the tab inside the 350 ms debounce. Draft survives in the same browser.
- [ ] Clear current, then Undo. Import a common VCF/ICS, then Undo. Editing after a replacement dismisses the old Undo snapshot.
- [ ] Save two named contacts and an event. Open, rename, duplicate as a template, and remove them. A duplicated event must have a new UID.
- [ ] Storage blocked/full/malformed: app still works and reports that saving is unavailable.
- [ ] Forget saved data cancels a pending autosave, empties both drafts and the shelf, and leaves unrelated localStorage keys intact. Check a second open tab too.
- [ ] Select a meeting/workshop/celebration preset. Name, description, location, and timezone must stay unchanged. Check all-day and year-boundary dates.
- [ ] Check event countdown and elapsed duration in a different timezone and across daylight-saving changes.
- [ ] Download QR PNG at each size, SVG, designed card PNG, VCF, and ICS. Open every output. Confirm long names and XML-sensitive text remain safe.
- [ ] Print preview shows only one clean card, not the editor or blank extra pages.
- [ ] Scan the final assets with physical iOS and Android devices at their intended display/print size. Check accented names and multi-day events.
- [ ] Native share opens the device menu where supported; canceling is not counted as a completed export. Unsupported file sharing falls back to a download.
- [ ] Share this tool sends only the canonical generator URL, never draft data or a payload in the URL.
- [ ] Reduced-motion preference suppresses milestone animations. No automatic audio, confetti, motion, or forced extra data collection.

## Product and release communication

The engagement loop is useful output, not artificial points: enter details, validate, export/share, save a reusable copy, recommend the free tool. The progress indicator records actions, not a scan-quality certification. The shelf is bounded and local. QR density is a practical warning, not a guarantee of camera compatibility.

Describe the user benefit, fixes, known limitations, and any effect on saved drafts or exports. Use the actual commit and publication date. Do not invent prior releases or assign a new version solely for cosmetic presentation.

## Deployment and rollback

After an approved deployment, verify the intended Pages commit, application entry point, critical assets, contact/event exports, and browser storage behavior. Keep the previous known-good commit recorded.

For a regression, revert the responsible change through a normal pull request and the existing Pages workflow. Do not force-push or delete users' local storage. Storage compatibility must be checked against the specific rollback version, not assumed from an earlier upgrade's notes.
