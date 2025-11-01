# Contributing Guidelines

Thank you for your interest in the PICYBOO Browser Stub Extension (MV3) demo. While the production codebase remains private, this repository helps partners, auditors, and investors understand our capture workflow.

## How we collaborate
- **Internal first:** Open pull requests from trusted branches only. This repository mirrors internal workstreams periodically; do not push directly to `main`.
- **Design pairing:** UX changes must be reviewed by the brand squad to ensure consistency with the broader PICYBOO design language.
- **Security review:** Any change involving new permissions, APIs, or data flows requires a security sign-off.

## Development workflow
1. Fork or branch the repository.
2. Run `npm install` to ensure tooling dependencies are available.
3. Implement your change and add or update relevant documentation under `docs/`.
4. Run `npm run lint` and ensure no errors remain.
5. Submit a pull request that links to the associated internal ticket.

## Commit conventions
- Prefix commits with the subsystem, e.g., `ui:`, `core:`, `docs:`, or `ops:`.
- Write descriptive summaries in the imperative mood ("Add export helper" not "Added export helper").
- Reference the internal task ID in the commit body when applicable.

## Code style
- Prefer modern JavaScript with async/await and explicit error handling.
- Avoid adding new dependencies without approval from the platform team.
- Keep UI copy concise and jargon-free; if in doubt, consult the comms team.

## License & attribution
By contributing, you agree that your changes are provided under the MIT License that governs this repository. Trademark usage must align with official brand guidelines.
