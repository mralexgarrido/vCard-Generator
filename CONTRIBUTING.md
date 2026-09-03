# Contributing

Thank you for helping improve the vCard & Event QR Code Generator.

## Before opening an issue

- Search existing issues for the same problem or request.
- Confirm the issue occurs on the current `main` branch.
- For QR problems, include the device, operating system, camera or scanner app, and generated format.
- Never post real contact details, private event information, credentials, or other sensitive data.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `npm ci`.
3. Make the smallest cohesive change.
4. Add or update tests for data-format behavior.
5. Run `npm run check`.
6. Open a pull request with the problem, approach, validation, and screenshots when the interface changes.

## Technical expectations

- Preserve browser-only processing and do not introduce telemetry by default.
- Keep contact output compatible with vCard 3.0 clients.
- Keep event output compatible with iCalendar 2.0 clients.
- Escape untrusted input and preserve CRLF line endings.
- Maintain keyboard access, visible focus, labels, contrast, and reduced-motion support.
- Avoid dependencies when a small, well-tested utility is sufficient.

By contributing, you agree that your contribution will be licensed under the MIT License.
