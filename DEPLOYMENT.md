# GitHub Actions Deployment Setup

This document explains the comprehensive GitHub Actions setup for automatic deployment of the Quarto website to GitHub Pages.

## Implementation Overview

Two GitHub Actions workflows have been implemented:

### 1. `quarto-publish.yml` - Main Deployment Workflow

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch (for testing)
- Manual trigger via workflow dispatch

**Jobs:**

#### Build Job
- **OS:** Ubuntu Latest
- **Steps:**
  1. Checkout repository
  2. Setup Quarto (latest release)
  3. Configure GitHub Pages
4. Inject password hash for gallery protection (from GALLERY_PW secret)
  5. Render Quarto project to HTML
  6. Upload Pages artifact from `docs/` directory

#### Deploy Job
- **Environment:** `github-pages`
- **Conditions:** Only runs on main/master branch pushes
- **Dependencies:** Requires build job to complete successfully
- **Action:** Deploy to GitHub Pages using the built artifact

**Permissions:**
- `contents: read` - Read repository contents
- `pages: write` - Write to GitHub Pages
- `id-token: write` - Write identity tokens for deployment

**Concurrency:**
- Group: "pages"
- Cancel in progress: false (allows deployments to complete)

### 2. `validate-quarto.yml` - Validation Workflow

**Triggers:**
- Manual trigger via workflow dispatch
- Pull requests that modify:
  - `_quarto.yml` configuration
  - `*.qmd` content files
  - GitHub Actions workflows

**Purpose:**
- Validates Quarto configuration
- Tests rendering process without deployment
- Provides early feedback on content changes

## Configuration Details

### Quarto Configuration (`_quarto.yml`)
- **Project Type:** Website
- **Output Directory:** `docs/` (required for GitHub Pages)
- **Format:** HTML with Cosmo theme

### Git Ignore (`.gitignore`)
Enhanced to exclude Quarto-specific files:
- `/.quarto/` - Quarto cache directory
- `*_cache/` - Rendering cache directories
- `.quarto` - Additional Quarto files
- `_site/` - Alternative output directory
- `*.tmp` - Temporary files
- `.DS_Store`, `Thumbs.db` - OS-specific files

## Deployment Process

1. **Developer pushes changes** to main/master branch
2. **Build job triggers** and:
   - Sets up fresh Ubuntu environment
   - Installs Quarto
   - Renders all `.qmd` files to HTML in `docs/`
   - Uploads the `docs/` directory as Pages artifact
3. **Deploy job triggers** (only on main/master) and:
   - Downloads the artifact
   - Deploys to GitHub Pages
   - Makes site live at `https://jacobkmcpherson.github.io`

## Benefits

1. **Automated Deployment:** No manual steps required
2. **Version Control:** All source files tracked in Git
3. **Build Validation:** PRs are tested before merge
4. **Consistent Environment:** Same Quarto version used for all builds
5. **Rollback Capability:** Can revert to any previous commit
6. **Concurrent Safety:** Only one deployment at a time

## Gallery Password Protection

The gallery page is protected with password authentication. The protection works as follows:

1. **Build-Time Injection:** The GALLERY_PW secret is hashed (SHA-256) and injected into the password protection script during the build process
2. **Complete Placeholder Replacement:** All placeholder occurrences in the script are replaced using sed's global flag to ensure proper functionality
3. **Client-Side Validation:** The password is verified in the browser against the injected hash
4. **Session Storage:** Authentication persists within a browser session
5. **Fail-Secure:** If the GALLERY_PW secret is not configured, the page shows a configuration error

**Security Features:**
- No plaintext passwords in source code
- Password hash is generated at build time from repository secret
- Fail-secure design prevents access if misconfigured (unless optional mode is enabled)
- Safe DOM manipulation to prevent XSS vulnerabilities
- Session-based authentication
- Comprehensive verification ensures all placeholders are replaced

**Implementation Details:**
The password protection script (`gallery/password-protect.js`) contains placeholder strings `%%GALLERY_PASSWORD_HASH%%` that are replaced during the build:
- The workflow uses `sed -i "s|%%GALLERY_PASSWORD_HASH%%|$PASSWORD_HASH|g"` with the global flag (`g`) to replace ALL occurrences
- Two verification checks ensure proper injection:
  1. Confirms the password hash constant is correctly set
  2. Verifies no placeholders remain in the file
- If either check fails, the build stops with an error
- The gallery password protection is always enforced when the script is loaded

**Configuration:**
To set the gallery password, add a `GALLERY_PW` repository secret:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `GALLERY_PW`
4. Value: Your desired password (will be hashed automatically)
5. Click "Add secret"

The workflow will automatically use this secret on the next build.

## Troubleshooting

- **Build failures:** Check the Actions tab for detailed logs
- **Deployment failures:** Verify GitHub Pages is enabled in repository settings
- **Content issues:** Use the validation workflow to test changes

## Repository Settings Required

For this to work, the repository needs:
1. **GitHub Pages enabled** with source set to "GitHub Actions"
2. **Actions permissions** enabled
3. **Branch protection** (optional but recommended) for main/master branch
4. **GALLERY_PW secret** set in repository settings (Settings → Secrets and variables → Actions → New repository secret)
   - This secret is required for the gallery password protection feature
   - The workflow will fail if this secret is not configured
