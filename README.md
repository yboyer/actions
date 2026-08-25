# ci-templates

Repository of reusable GitHub Actions templates.

## Available templates

### Trivy — security scan

The [`trivy`](trivy/action.yml) composite action uses [Trivy](https://github.com/aquasecurity/trivy) to scan the checked-out repository source code for security vulnerabilities.

#### Usage

Create a `.github/workflows/security.yml` file in your repository. Check out its source before invoking the remote action:

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
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
      - uses: yboyer/ci-templates/trivy@master
```

### Docker publish

The [`docker-publish`](docker-publish/action.yml) composite action builds, tags, and publishes an image to GHCR. It creates semver tags and `latest`.

#### Usage

The calling workflow needs `contents: read` to check out its source and `packages: write` to publish to GHCR. Check out its source before invoking the remote action:

```yaml
permissions:
  contents: read
  packages: write

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7.0.1
      - uses: yboyer/ci-templates/docker-publish@master
        with:
          image: ghcr.io/yboyer/asphalia/api
          dockerfile: ./.docker/Dockerfile.api
          secrets: |
            sentry_auth_token=${{ secrets.SENTRY_AUTH_TOKEN }}
```

The `secrets` input uses the same `id=value` format as [`docker/build-push-action`](https://github.com/docker/build-push-action). The Dockerfile can consume the above secret with `RUN --mount=type=secret,id=sentry_auth_token ...`.
