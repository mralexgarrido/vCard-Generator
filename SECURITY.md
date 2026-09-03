# Security Policy

## Supported version

Security fixes are applied to the latest version on the `main` branch.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting option in the repository **Security** tab when available. If private reporting is unavailable, open a minimal issue asking the maintainer for a private contact method. Do not include exploit details, private contact data, or event data in a public issue.

Include:

- A concise description of the issue
- Reproduction steps using synthetic data
- The affected browser or operating system
- The likely impact
- A suggested mitigation, if known

## Data-handling model

The deployed app is static. It processes entries in browser memory and does not intentionally send them to a server, store them locally, or collect analytics. A change that introduces network transmission, persistent storage, authentication, or telemetry must disclose that behavior clearly and receive maintainer review.
