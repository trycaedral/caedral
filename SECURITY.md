# Security Policy

## Supported versions

Security fixes target the latest release line.

| Version | Supported |
|---------|-----------|
| latest release | yes |
| older releases | best-effort |

## Reporting a vulnerability

Email **security@caedral.com** with:

- description of the issue and affected component/version;
- step-by-step reproduction;
- impact assessment;
- a non-destructive proof-of-concept, if available.

You will receive an acknowledgment and updates while a fix is developed.

## Rules of engagement

- Do **not** open public issues, PRs or discussions for exploitable defects.
- Do **not** test against production (`caedral.com` / `api.caedral.com`). Run the
  software locally or against your own instance and synthetic accounts only.
- Never commit secrets (`.env`, API keys, tokens). Rotate anything that may have
  been exposed and report suspected key compromise so it can be revoked.

## Disclosure

We follow a **90-day coordinated disclosure** window: we acknowledge the report,
develop and ship a fix, then publish an advisory crediting you (if you wish).
Advisories go out once the fix is available, within 90 days of the initial
report except in critical operational circumstances.
