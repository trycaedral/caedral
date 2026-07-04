# Publishing the Caedral SDK to npm

This guide walks through publishing the `caedral` npm package from the `sdk/` folder. **Do not publish until you are ready** — the package name `caedral` is public and permanent once taken.

## Prerequisites

- npm account with access to publish `caedral` (create at https://www.npmjs.com/signup if needed)
- npm CLI logged in on your machine
- Clean git state and a version bump committed

## Pre-publish checklist

1. **Version bump** — update `"version"` in `sdk/package.json` following [semver](https://semver.org/):
   - Patch (`0.1.0` → `0.1.1`): bug fixes, no API changes
   - Minor (`0.1.0` → `0.2.0`): new methods or backward-compatible additions
   - Major (`0.1.0` → `1.0.0`): breaking changes to public API or types

2. **Build passes**
   ```bash
   cd sdk
   npm install
   npm run build
   npm test
   ```

3. **Inspect the tarball** — confirm only `dist/` and `README.md` ship (see `"files"` in `package.json` and `.npmignore`):
   ```bash
   npm pack --dry-run
   ```

4. **Verify metadata** in `package.json`:
   - `name`: `"caedral"`
   - `description`, `license`, `repository`, `keywords`, `author`
   - `exports` point to built `dist/` files

5. **Tag the release** in git (recommended):
   ```bash
   git tag sdk-v0.1.0
   git push origin sdk-v0.1.0
   ```

## Publish commands

From the **`sdk/` directory**:

```bash
cd sdk

# Log in (once per machine, or when token expires)
npm login

# Final check — lists files that will be published
npm pack --dry-run

# Publish (prepublishOnly runs npm run build automatically)
npm publish --access public
```

> The package is unscoped (`caedral`, not `@caedral/sdk`), so `--access public` is required on first publish.

## After publishing

1. Confirm on https://www.npmjs.com/package/caedral
2. Test install in a fresh project:
   ```bash
   mkdir /tmp/caedral-sdk-test && cd /tmp/caedral-sdk-test
   npm init -y
   npm install caedral
   node -e "import('caedral').then(m => console.log(Object.keys(m)))"
   ```
3. Update site docs if the version or API surface changed

## Unpublishing

npm unpublish is heavily restricted (especially after 72 hours). Prefer publishing a patch fix rather than unpublishing.

## Local testing without publishing

Link the package locally:

```bash
cd sdk && npm run build && npm link
cd your-app && npm link caedral
```

Or use a `file:` dependency in `package.json`:

```json
"caedral": "file:../sdk"
```
