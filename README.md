# ci-templates

Repository of reusable GitHub Actions workflow templates.

## Available workflows

### Trivy — security scan

The [`trivy.yml`](.github/workflows/trivy.yml) workflow uses [Trivy](https://github.com/aquasecurity/trivy) to scan for security vulnerabilities (`CRITICAL`, `HIGH`) in the repository source code. Results are published to the GitHub **Security** tab via SARIF format.

#### Usage

Create a `.github/workflows/security.yml` file in your repository:

```yaml
name: Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 6 * * 1" # Every Monday at 06:00

jobs:
  trivy:
    uses: yboyer/ci-templates/.github/workflows/trivy.yml@main
```