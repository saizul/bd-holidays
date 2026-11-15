# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | yes       |

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

Report privately through GitHub's **Report a vulnerability** button under the repository's
Security tab (private vulnerability reporting). Include:

- a description of the issue and its impact
- steps to reproduce, or a proof of concept
- the affected version or commit

You will get an acknowledgement within 7 days. A fix or mitigation plan will follow once the
report is confirmed.

## Scope

The library does no network or file access, except the CLI's `--out` option, which writes to
the path you give it. Issues of interest include:

- crafted input that makes a function hang or use excessive memory
- output injection in the iCalendar or CSV exporters (for example breaking out of a field)

Incorrect holiday dates are data bugs, not security issues: please open a normal issue with a
link to the official source.
