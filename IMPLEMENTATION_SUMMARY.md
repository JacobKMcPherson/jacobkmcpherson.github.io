# Gallery Password Protection - Implementation Summary

## What Was Implemented

This implementation adds client-side password protection to the gallery page using a GitHub repository secret. The password hash is injected at build time, ensuring the actual password never appears in the source code.

## Changes Made

### 1. Password Protection JavaScript (`gallery/password-protect.js`)
- Client-side authentication using SHA-256 hashing
- Session-based authentication (password required per browser session)
- User-friendly password prompt overlay with professional styling
- Hides gallery content until correct password is entered
- Secure implementation that denies access if password hash is not properly configured

### 2. Gallery Page Update (`gallery/index.qmd`)
- Added script reference to load password protection module
- Uses Quarto's `include-after-body` to inject the script

### 3. GitHub Actions Workflow Update (`.github/workflows/quarto-publish.yml`)
- New "Inject Password Hash" step that:
  - Reads `GALLERY_PASSWORD` secret from repository settings
  - Generates SHA-256 hash using standard Linux tools
  - Replaces placeholder in JavaScript file with actual hash
  - Uses environment variable to prevent password from appearing in logs

### 4. Documentation (`gallery/PASSWORD_SETUP.md`)
- Complete setup instructions for creating the `GALLERY_PASSWORD` secret
- Explanation of how the system works
- Important security warnings about client-side protection limitations
- Troubleshooting guide

## Setup Instructions

### Step 1: Set the Repository Secret

1. Go to GitHub repository settings: `https://github.com/JacobKMcPherson/jacobkmcpherson.github.io/settings/secrets/actions`
2. Click **New repository secret**
3. Name: `GALLERY_PASSWORD`
4. Value: Your desired password (choose a strong password)
5. Click **Add secret**

### Step 2: Trigger Deployment

The password protection will be activated on the next deployment. You can:
- Push any commit to the main/master branch, OR
- Go to Actions tab and manually trigger the "Publish Quarto Website" workflow

### Step 3: Verify

1. Wait for the deployment to complete
2. Visit your gallery page: `https://jacobkmcpherson.github.io/gallery/`
3. You should see a password prompt
4. Enter the password you set in the secret
5. The gallery content should be displayed

## Security Considerations

### What This Protects Against
- Casual visitors browsing the gallery
- Search engine indexing (content is hidden until authentication)
- Simple privacy needs

### Limitations
⚠️ This is **client-side protection** with inherent limitations:
- The password hash is included in the deployed JavaScript
- Determined users can inspect the code and extract the hash
- Browser developer tools can be used to access content
- JavaScript can be disabled to potentially bypass protection

### When to Use This
- Basic privacy for personal content
- Keeping casual visitors out
- Simple "friends and family" access control

### When NOT to Use This
- Highly sensitive or confidential content
- Legal or compliance requirements
- When strong security is needed

For stronger security, consider:
- Server-side authentication
- Private repository with access control
- Professional hosting with authentication

## Testing

All implementation tests passed:
- ✓ Hash generation works correctly
- ✓ Workflow command generates correct hash
- ✓ All JavaScript components present and valid
- ✓ All workflow components present and valid
- ✓ Gallery page integration correct
- ✓ No security vulnerabilities detected by CodeQL

## Maintenance

### Changing the Password
1. Go to repository settings → Secrets
2. Update the `GALLERY_PASSWORD` secret value
3. Next deployment will use the new password

### Removing Password Protection
To remove password protection:
1. Revert the changes to `gallery/index.qmd` (remove script reference)
2. Delete `gallery/password-protect.js`
3. Remove the "Inject Password Hash" step from `.github/workflows/quarto-publish.yml`

## Files Modified
- `.github/workflows/quarto-publish.yml` - Added password hash injection step
- `gallery/index.qmd` - Added script reference
- `gallery/password-protect.js` - New file with password protection logic
- `gallery/PASSWORD_SETUP.md` - New file with setup documentation
