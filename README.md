# ci-templates

Repository of reusable GitHub Actions workflow templates.

## Available workflows

### Trivy — security scan

The [`trivy.yml`](.github/workflows/trivy.yml) workflow uses [Trivy](https://github.com/aquasecurity/trivy) to scan for security vulnerabilities in the repository source code.

#### Usage

Create a `.github/workflows/security.yml` file in your repository:

```yaml
name: Security Scan

on:
  workflow_dispatch:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 6 * * 1"

jobs:
  trivy:
    uses: yboyer/ci-templates/.github/workflows/trivy.yml@master
```
