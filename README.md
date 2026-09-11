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
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: yboyer/actions/trivy-scan@bdee153c4c32daddb38e4849726db49152fb34bd # v1.2.0
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
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: docker/login-action@dbcb813823bdd20940b903addbd779551569679f # v4.6.0
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: yboyer/actions/docker-publish@db457ced48bf1a7cbc7987319d3028e2c7271d33 # v1.2.1
        with:
          image: ghcr.io/yboyer/example/api
          dockerfile: ./.docker/Dockerfile.api
          secrets: |
            token=${{ secrets.TOKEN }}
```

The `secrets` input uses the same `id=value` format as [`docker/build-push-action`](https://github.com/docker/build-push-action). The Dockerfile can consume the above secret with `RUN --mount=type=secret,id=token ...`.

Docker tags are derived from the checked-out Git ref. Check out the release tag before invoking this action, including for manually orchestrated releases.

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
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
      - uses: yboyer/actions/npm-bump-version@db457ced48bf1a7cbc7987319d3028e2c7271d33 # v1.2.1
        with:
          release-type: ${{ inputs.release_type }}
```

The action requires `contents: write`. Check out the repository's primary branch with full history before invoking it.

### NPM release — direct version bump

Use this workflow when version bumps are committed directly to the primary branch instead of through a release pull request. `bump` runs manually; `publish` waits for it, then publishes the new tag. It also runs when a `v*.*.*` tag is pushed directly.

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
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - id: bump
        uses: yboyer/actions/npm-bump-version@db457ced48bf1a7cbc7987319d3028e2c7271d33 # v1.2.1
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
      RELEASE_TAG: ${{ github.event_name == 'workflow_dispatch' && needs.bump.outputs.tag || github.ref_name }}
      RELEASE_REF: ${{ github.event_name == 'workflow_dispatch' && needs.bump.outputs.tag || github.ref }}
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          ref: ${{ env.RELEASE_REF }}
      # Add the project checks before publication if needed
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version-file: .node-version
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present
      - run: npm publish --provenance --access public
      - name: Create GitHub release
        uses: softprops/action-gh-release@efb35369e0ad2afab669f228072c1b0d510eae64 # v3.0.3
        with:
          tag_name: ${{ env.RELEASE_TAG }}
          name: ${{ env.RELEASE_TAG }}
          generate_release_notes: true
```

`npm-bump-version` needs `contents: write`; a full checkout history is not required for this direct version-bump workflow. `publish` depends on `bump` for a manual run, but still runs for a pushed tag because `always()` prevents its skipped dependency from skipping the job. The example uses `npm publish` directly: `npm-bump-version` has already created the tag, whereas `npm-release-publish` only publishes when it creates that tag itself. `id-token: write` enables npm trusted publishing.
