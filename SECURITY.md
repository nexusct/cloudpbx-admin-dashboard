# Security Policy

This repository is maintained by **Nexus Communications Technology** (Nexuscomm LLC).

## Reporting a Security Vulnerability

If you discover a security vulnerability, **do not** open a public GitHub issue.

Instead, email **office@nexusct.com** with:
- A description of the vulnerability
- Steps to reproduce (if applicable)
- The commit/branch where you observed it
- Your assessment of severity and impact

We will:
- Acknowledge receipt within 2 business days
- Investigate and triage the issue
- Keep you informed of remediation progress
- Credit you in the advisory (if desired) when the fix is released

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Security Best Practices

### What belongs in this repo

**Never commit:**
- Passwords, API keys, tokens, private keys, certificates
- Internal pricing data, dealer costs, margin percentages
- Customer PII or PHI
- Internal network addresses or credentials
- Database dumps or backups containing real data
- Real webhook secrets or signing keys

Use environment variables (`.env`), a gitignored `config.js`, or a runtime secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.) — never hardcode credentials.

### Pre-commit Hooks

This repository uses [pre-commit](https://pre-commit.com/) with multiple security scanners:

- **gitleaks** — Detects committed secrets (API keys, tokens, passwords)
- **detect-secrets** — Second-layer credential scanner
- **Nexus-specific pattern blocks** — Rejects known-bad strings from past incidents

**Setup (one-time per clone):**

```bash
pip install pre-commit
pre-commit install
```

Hooks will run automatically on every commit. To manually scan all files:

```bash
pre-commit run --all-files
```

### Dependency Security

We use multiple tools to keep dependencies secure:

- **npm audit** — Weekly automated scans
- **Dependabot** — Automatic PR creation for vulnerable dependencies
- **Manual reviews** — All dependency updates are reviewed before merging

To check for vulnerabilities locally:

```bash
npm audit
```

### Secure Development

When contributing to this repository:

1. **Never** commit `.env` files or real credentials
2. Use `.env.example` for documenting required environment variables
3. Validate all user input with Zod schemas before processing
4. Use parameterized queries (Drizzle ORM) to prevent SQL injection
5. Keep dependencies up to date with security patches
6. Review all third-party packages before adding them

## Recent Security Updates

### 2026-08 (This Release)

**Dependency Updates:**
- Updated `drizzle-orm` from 0.39.3 → 0.45.2 (fixes CVE-2026-39356: SQL injection via identifiers)
- Updated `ws` from 8.18.0 → 8.21.1 (fixes CVE-2026-48779, CVE-2026-62389: WebSocket DoS)
- Updated `vite` from 7.3.0 → 7.3.5 (fixes CVE-2026-39364: fs.deny bypass)
- Updated `postcss` from 8.5.6 → 8.5.23 (fixes CVE-2026-69153: path traversal)
- Updated `lodash` from 4.17.23 → 4.18.1 (fixes CVE-2026-4800: template injection)

**Security Review:**
- Verified no hardcoded credentials in source code
- Confirmed seed data uses example/placeholder secrets only
- Reviewed authentication and webhook signature validation patterns
- Updated documentation to clearly identify required environment variables

**Findings:**
- ✅ Google API key alert (#1) verified as already removed in previous incident response
- ✅ All API credentials properly externalized to environment variables
- ✅ Pre-commit hooks functioning correctly
- ⚠️ No authentication system currently implemented (application assumes trusted network)

**Recommendations:**
1. Consider implementing authentication middleware if exposing to untrusted networks
2. Implement webhook signature verification when webhook functionality is enabled
3. Add rate limiting to public API endpoints

## Incident History

### 2026-04-19 — Credential Exposure (NCT-SEC-2026-04-19-001)

**Summary:** Google Maps API key and admin password were accidentally committed to the repository.

**Response:**
- Rotated Google Maps API key immediately
- Changed admin password across all systems
- Implemented enhanced pre-commit hooks
- Updated `.gitignore` with comprehensive secret patterns
- Created `SECURITY.md` and enhanced security documentation
- Conducted full repository scan for other exposed credentials

**Status:** Resolved. Full incident report on file.

**Prevention:** Pre-commit hooks now block:
- Google API keys (AIza... pattern)
- AWS access keys
- Private keys (PEM format)
- Known retired passwords
- Other sensitive patterns

## Security Contact

For security concerns, contact:
- **Email:** office@nexusct.com
- **Type:** Security vulnerability reports only
- **Response time:** 2 business days
