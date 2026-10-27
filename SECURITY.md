# Security

Soirée is a static site: there is no server, no database and no accounts. Everything runs in your browser.

## How the app protects you

- **Content Security Policy.** `index.html` allows scripts only from this site, forbids plugins and `<base>` tags, and limits network calls to this site and `api.anthropic.com`.
- **Escaped output.** All user text is escaped with `Util.esc` before it is placed in the page; text that is shown with `textContent` needs no escaping.
- **Nothing saved is trusted.** Saved plans, imported JSON files and share links are never used as they are. `Engine.restore` keeps only the wizard inputs, validates and rebuilds the plan, and passes progress through `Engine.sanitizeProgress` (types, lengths, id characters, colours, ranges).
- **AI output is untrusted.** Claude's reply goes through `Engine.sanitizeAi` (known fields only, length limits, valid colours) before it is shown or saved.
- **Your API key stays with you.** It is optional, kept in `sessionStorage` (cleared when the tab closes) unless you choose to remember it on this device, and sent only to `api.anthropic.com`. Use a key with a low spending limit, and do not store it on shared computers.
- **Safe downloads.** The guest CSV prefixes cells that start with `=`, `+`, `-` or `@` so spreadsheets do not run them as formulas, and calendar files are escaped and folded to the iCalendar rules.
- **Share links** carry only the wizard inputs (event type, name, date, guests, budget and similar), never progress, guests or keys, and are size-limited when decoded.
- **Supply chain.** The only runtime dependency is a bundled copy of Three.js (MIT). Dependabot, `npm audit` and CodeQL run in GitHub Actions.

## Reporting a problem

Please open a private security advisory on the GitHub repository (Security tab, "Report a vulnerability"), or an issue if you prefer. Include the steps to reproduce.
