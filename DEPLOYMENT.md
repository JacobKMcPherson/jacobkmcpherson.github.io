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
  4. Render Quarto project to HTML
  5. Upload Pages artifact from `docs/` directory

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

## Troubleshooting

- **Build failures:** Check the Actions tab for detailed logs
- **Deployment failures:** Verify GitHub Pages is enabled in repository settings
- **Content issues:** Use the validation workflow to test changes

## Repository Settings Required

For this to work, the repository needs:
1. **GitHub Pages enabled** with source set to "GitHub Actions"
2. **Actions permissions** enabled
3. **Branch protection** (optional but recommended) for main/master branch