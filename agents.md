# Repository instructions

## GitHub Actions

- Reusable composite actions live in a top-level directory and expose `action.yml`.
- Keep workflows in `.github/workflows/` focused on orchestration: checkout and invoke local or reusable actions.
- Workflow-level or action-step `env` values are inherited by the steps of a composite action. Do not add an input only to forward an environment variable such as `GITHUB_TOKEN`.
- Gitleaks scans require a full Git history: configure checkout with `fetch-depth: 0`.
