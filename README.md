# actions

Repository of reusable GitHub Actions.

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
      - uses: yboyer/actions/trivy-scan@v1.0.0
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
      - uses: yboyer/actions/gitleaks@v1.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Docker publish

The [`docker-publish`](docker-publish/action.yml) composite action builds, tags, and publishes an image to GHCR. It creates semver tags and `latest`.

#### Usage

The job grants `contents: read` so `actions/checkout` can fetch the source, and `packages: write` so `GITHUB_TOKEN` can publish the image to GHCR.

For GHCR uploads, add the optional authentication step before `docker-publish`, as shown below.

```yaml
jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v7.0.1
      - uses: docker/login-action@v4.6.0
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: yboyer/actions/docker-publish@v1.0.0
        with:
          image: ghcr.io/yboyer/example/api
          dockerfile: ./.docker/Dockerfile.api
          secrets: |
            token=${{ secrets.TOKEN }}
```

The `secrets` input uses the same `id=value` format as [`docker/build-push-action`](https://github.com/docker/build-push-action). The Dockerfile can consume the above secret with `RUN --mount=type=secret,id=token ...`.

### NPM release

The [`npm-release-prepare`](npm-release-prepare/action.yml) action increments a package version and creates its release pull request. The [`npm-release-publish`](npm-release-publish/action.yml) action tags and publishes the merged package version. Both expect a checked-out npm project with `package.json` and `package-lock.json`.

### NPM version bump

The [`npm-bump-version`](npm-bump-version/action.yml) action increments a package version, commits the changed manifest on the primary branch, then creates and pushes its `v<version>` tag. It does not create a pull request.

```yaml
name: Bump version

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: Version increment
        required: true
        default: patch
        type: choice
        options: [major, minor, patch, premajor, preminor, prepatch, prerelease]

jobs:
  bump:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          fetch-depth: 0
      - uses: yboyer/actions/npm-bump-version@v1.0.0
        with:
          release-type: ${{ inputs.release_type }}
```

The action requires `contents: write`. Check out the repository's primary branch with full history before invoking it.

Use `prepare` from `workflow_dispatch`, then `publish` when the version-bump pull request updates `package.json` and `package-lock.json` on the default branch.

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: Version increment
        required: true
        default: patch
        type: choice
        options: [major, minor, patch, premajor, preminor, prepatch, prerelease]
  push:
    branches: [master, main]
    paths: [package.json, package-lock.json]

jobs:
  prepare:
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          fetch-depth: 0
      - uses: yboyer/actions/npm-release-prepare@v1.0.0
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          release-type: ${{ inputs.release_type }}

  publish:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          fetch-depth: 0
      # Add the project checks required before publication.
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
      - id: publish
        uses: yboyer/actions/npm-release-publish@v1.0.0
      - name: Create GitHub release
        if: steps.publish.outputs.published == 'true'
        uses: softprops/action-gh-release@efb35369e0ad2afab669f228072c1b0d510eae64 # v3.0.3
        with:
          tag_name: ${{ steps.publish.outputs.tag }}
          name: ${{ steps.publish.outputs.tag }}
          generate_release_notes: true
```

`npm-release-prepare` needs `contents: write` and `pull-requests: write`, plus a full checkout history to list commits since the last tag. It outputs `version`, `branch`, and `pull-request-url`; pass the required `GH_TOKEN` to its step. `npm-release-publish` needs `contents: write` for the tag and release plus `id-token: write` for npm trusted publishing. Install dependencies and run the project checks before invoking it. The actions use the workflow `GITHUB_TOKEN`; allow GitHub Actions to create pull requests in the repository settings when required.

### NPM release — direct version bump

Use this workflow when version bumps are committed directly to the primary branch instead of through a release pull request. `bump` runs manually; `publish` waits for it, then publishes the new tag. It also runs when a `v*.*.*` tag is pushed directly.

```yaml
name: Release from direct bump

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: Version increment
        required: true
        default: patch
        type: choice
        options: [major, minor, patch, premajor, preminor, prepatch, prerelease]
  push:
    tags:
      - 'v*.*.*'

jobs:
  bump:
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    outputs:
      tag: ${{ steps.bump.outputs.tag }}
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          fetch-depth: 0
      - id: bump
        uses: yboyer/actions/npm-bump-version@v1.0.0
        with:
          release-type: ${{ inputs.release_type }}

  publish:
    needs: bump
    # Run for pushed tags, or after a successful manual bump.
    if: ${{ always() && (github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && needs.bump.result == 'success')) }}
    runs-on: ubuntu-latest
    permissions:
      contents: write
      id-token: write
    env:
      RELEASE_REF: ${{ github.event_name == 'workflow_dispatch' && needs.bump.outputs.tag || github.ref }}
      RELEASE_TAG: ${{ github.event_name == 'workflow_dispatch' && needs.bump.outputs.tag || github.ref_name }}
    steps:
      - uses: actions/checkout@v7.0.1
        with:
          fetch-depth: 0
          ref: ${{ env.RELEASE_REF }}
      # Add the project checks required before publication.
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
      - run: npm publish --provenance
      - name: Create GitHub release
        uses: softprops/action-gh-release@efb35369e0ad2afab669f228072c1b0d510eae64 # v3.0.3
        with:
          tag_name: ${{ env.RELEASE_TAG }}
          name: ${{ env.RELEASE_TAG }}
          generate_release_notes: true
```

`npm-bump-version` needs `contents: write` and a full checkout history. `publish` depends on `bump` for a manual run, but still runs for a pushed tag because `always()` prevents its skipped dependency from skipping the job. The example uses `npm publish` directly: `npm-bump-version` has already created the tag, whereas `npm-release-publish` only publishes when it creates that tag itself. `id-token: write` enables npm trusted publishing.
