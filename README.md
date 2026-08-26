# ci-templates

Repository of reusable GitHub Actions templates.

## Available templates

### Trivy — security scan

The [`trivy-scan`](trivy-scan/action.yml) composite action uses [Trivy](https://github.com/aquasecurity/trivy) to scan the checked-out repository source code for security vulnerabilities.

#### Usage

Create a `.github/workflows/security.yml` file in your repository. The example supports both `master` and `main`; remove either branch if your repository uses only one. Check out its source before invoking the remote action:

```yaml
name: Security Scan

on:
  workflow_dispatch:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]
  schedule:
    - cron: "0 6 * * 1"

jobs:
  trivy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
      - uses: yboyer/ci-templates/trivy-scan@master
```

### Gitleaks — secret scan

The [`gitleaks`](gitleaks/action.yml) composite action uses [Gitleaks](https://github.com/gitleaks/gitleaks) to scan the repository history for leaked secrets. Check out the complete history before running it.

#### Usage

```yaml
name: Secrets Scan

on:
  workflow_dispatch:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          fetch-depth: 0
      - uses: yboyer/ci-templates/gitleaks@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Docker publish

The [`docker-publish`](docker-publish/action.yml) composite action builds, tags, and publishes an image to GHCR. It creates semver tags and `latest`.

#### Usage

The job grants `contents: read` so `actions/checkout` can fetch the source, and `packages: write` so `GITHUB_TOKEN` can publish the image to GHCR.

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v7.0.1
      - uses: yboyer/ci-templates/docker-publish@master
        with:
          image: ghcr.io/yboyer/example/api
          dockerfile: ./.docker/Dockerfile.api
          secrets: |
            token=${{ secrets.TOKEN }}
```

The `secrets` input uses the same `id=value` format as [`docker/build-push-action`](https://github.com/docker/build-push-action). The Dockerfile can consume the above secret with `RUN --mount=type=secret,id=token ...`.
