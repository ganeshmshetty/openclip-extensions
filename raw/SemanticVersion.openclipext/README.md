# Semantic Version

Bump a [semantic version](https://semver.org) without retyping it. Select a version such as
`1.2.3`, `v2.0.0-rc.1` or `"0.9.4"` in a `package.json`, changelog, tag name or commit message,
open **Semantic Version**, and pick the part to increase. The new version replaces the selection.

Everything runs locally on your Mac. Nothing is sent anywhere.

## Commands

| Command | Example | What it does |
| :--- | :--- | :--- |
| **Bump Major** | `1.2.3` → `2.0.0` | Incompatible API change. Resets minor and patch. |
| **Bump Minor** | `1.2.3` → `1.3.0` | Backwards-compatible feature. Resets patch. |
| **Bump Patch** | `1.2.3` → `1.2.4` | Backwards-compatible fix. |
| **Bump Pre-release** | `1.2.3-rc.1` → `1.2.3-rc.2` | Increments the last number of the pre-release. |

Bumping a pre-release to its own release is a no-op on the number, exactly as the specification's
precedence rules define it: **Bump Major** on `2.0.0-rc.1` gives `2.0.0`, **Bump Minor** on
`1.3.0-beta.2` gives `1.3.0`, and **Bump Patch** on `1.2.4-rc.1` gives `1.2.4`. That is how you
finalize a release candidate. Build metadata (`+…`) never survives a bump, because it identifies one
specific build.

Every command returns text, so it follows your *Preferences → General → “When an action returns
text”* setting: paste over the selection, copy, or show the result card. By default a left-click
pastes and a right-click (or ⇧-click) copies.

## Working with release candidates

**Bump Pre-release** on a version that has no pre-release moves to the next patch first, so `1.2.3`
becomes `1.2.4-rc.1`. This is deliberate and matches the reference implementation: a candidate
numbered `1.2.3-rc.1` would sort *below* the `1.2.3` you have already released, so it would be a step
backwards.

To start a candidate for a different target, bump that part first and add the suffix once by hand.
From then on **Bump Pre-release** iterates it, and the matching bump finalizes it:

| Step | Selection | Command | Result |
| :--- | :--- | :--- | :--- |
| Iterate | `13.3.0-rc.1` | Bump Pre-release | `13.3.0-rc.2` |
| Finalize | `13.3.0-rc.2` | Bump Minor | `13.3.0` |

## What it understands

- Full [SemVer 2.0.0](https://semver.org) syntax, including dotted pre-release identifiers
  (`1.0.0-alpha.1`, `1.0.0-0.3.7`, `1.0.0-x.7.z.92`) and build metadata (`1.0.0+20130313144700`).
- A `v` or `V` prefix, surrounding quotes and surrounding whitespace are preserved, so `v1.2.3`
  becomes `v1.3.0` and `"1.2.3"` becomes `"1.2.4"`.
- Versions that break the rules, such as `1.2` or `1.02.3`, are not recognized. The
  **Semantic Version** menu only appears when the selection is a valid version, so it stays out of
  the way otherwise.

## Configuration

| Option | Default | Effect |
| :--- | :--- | :--- |
| **Pre-release identifier** | `rc` | Label used when a new pre-release is started, for example `alpha`, `beta` or `rc`. Leave it empty for a purely numeric pre-release (`1.2.4-1`). |
| **First pre-release number** | `1` | Whether a new pre-release starts at `.1` or `.0`. |

Both options apply only when a pre-release is started from scratch. **Bump Pre-release** on an
existing pre-release always keeps its identifier and increments its number.

## Usage Examples

- **Releasing a package**: select `1.4.2` in `package.json`, choose **Bump Minor**, and the file now
  reads `1.5.0`.
- **Cutting a patch candidate**: select `2.0.0` and choose **Bump Pre-release** to get `2.0.1-rc.1`;
  after fixes, select it again for `2.0.1-rc.2`.
- **Shipping the candidate**: select `2.0.1-rc.2` and choose **Bump Patch** to get `2.0.1`.
- **Writing a git tag**: select `v0.9.4` in your terminal and right-click **Bump Patch** to copy
  `v0.9.5` for a `git tag` command.

## Privacy

The extension parses and rewrites versions entirely on your Mac using pure JavaScript. It performs
no network requests, keeps no logs and sends no analytics.

## Requirements

- OpenClip 1.1.0 or later.

## Credits

The icon is the `tag` glyph from [Lucide](https://lucide.dev) (ISC licence), recoloured to
`currentColor` so it follows the OpenClip theme.
