# CloudPBX Program RACI Template

Fill the `Assigned Human` column with real team names. Keep the role labels stable so agent ownership and reporting stay consistent.

## Role Directory
| Role | Assigned Human | Backup Human |
|---|---|---|
| Executive Sponsor | TBD | TBD |
| Product Owner | TBD | TBD |
| Engineering Lead | TBD | TBD |
| QA Lead | TBD | TBD |
| Security Lead | TBD | TBD |
| Carrier Partnerships Lead | TBD | TBD |
| Release Manager | TBD | TBD |

## RACI Matrix
| Workstream | General Manager Agent | Chief Orchestrator Agent | PBX Core Manager Agent | Provisioning Manager Agent | Firmware Manager Agent | UniFi Relay Manager Agent | Installer Manager Agent | QA Test Manager Agent | Security Test Lead Agent | Carrier Compatibility Lead Agent | Device/Firmware Compatibility Lead Agent | Performance & Reliability Lead Agent | Docs & Enablement Agent | Product Owner | Engineering Lead | QA Lead | Security Lead | Carrier Partnerships Lead | Release Manager |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Scope and priorities | A | C | I | I | I | I | I | C | C | I | I | I | I | R | C | I | I | I | I |
| Sprint planning and dependencies | C | A/R | C | C | C | C | C | C | I | I | I | I | I | C | C | I | I | I | I |
| SIP and media runtime delivery | I | C | A/R | C | I | I | I | C | C | C | C | C | I | C | R | C | C | I | I |
| Phone provisioning and discovery | I | C | C | A/R | C | C | I | C | C | I | C | I | I | C | R | C | C | I | I |
| Firmware lifecycle and rollout | I | C | I | C | A/R | I | I | C | C | I | C | C | I | C | R | C | C | I | I |
| UniFi Talk relay integration | I | C | C | C | I | A/R | I | C | C | I | C | I | I | C | R | C | C | I | I |
| Installer (ISO/OVA/QCOW2) | I | C | C | I | I | I | A/R | C | C | I | I | C | C | C | R | C | C | I | I |
| End-to-end test strategy and release scorecard | I | C | C | C | C | C | C | A/R | C | C | C | C | I | C | C | R | C | C | I |
| Security testing and hardening gates | I | I | C | C | C | C | C | C | A/R | I | I | C | I | I | C | C | R | I | I |
| Carrier interoperability certification | I | I | C | I | I | C | I | C | C | A/R | I | I | I | I | C | C | C | R | I |
| Device and firmware compatibility certification | I | I | C | C | C | C | I | C | C | I | A/R | C | I | I | C | C | C | I | I |
| Load, soak, and failover validation | I | I | C | I | C | I | C | C | C | I | I | A/R | I | I | C | C | C | I | I |
| Release notes, runbooks, and migration docs | I | I | C | C | C | C | C | C | C | C | C | C | A/R | C | I | C | C | C | R |
| Final release go/no-go | A | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C | R |

Legend:
- `R`: Responsible
- `A`: Accountable
- `C`: Consulted
- `I`: Informed

## Minimum Staffing Recommendation
1. General Manager + Chief Orchestrator
2. PBX Core Manager + Provisioning Manager + Firmware Manager
3. UniFi Relay Manager + Installer Manager
4. QA Test Manager + Security Test Lead + Carrier Compatibility Lead + Device/Firmware Compatibility Lead + Performance/Reliability Lead
5. Docs & Enablement Agent supported by a human release manager
