# Gallery Password Protection Setup

**This protection is suitable for basic privacy (keeping casual visitors out) but NOT for highly sensitive or confidential content.** For stronger security, consider server-side authentication or a private repository.

---

The gallery page is protected with a client-side password. The password is stored as a GitHub repository secret and injected into the build at deployment time.

## Setting Up the Password

1. Go to your GitHub repository settings
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `GALLERY_PASSWORD`
5. Value: Enter your desired password (use a strong password)
6. Click **Add secret**

## How It Works

1. **Build Time**: 
   - The GitHub Actions workflow reads the `GALLERY_PASSWORD` secret
   - It generates a SHA-256 hash of the password
   - The hash is injected into `gallery/password-protect.js` before building the site

2. **Runtime**:
   - When visitors access the gallery page, they are prompted for a password
   - The entered password is hashed using SHA-256
   - The hash is compared against the injected hash
   - If they match, the gallery content is displayed
   - Authentication is maintained for the browser session using sessionStorage

## Security Notes

- The actual password is never included in the source code or deployed files
- Only a SHA-256 hash of the password is included in the deployed site
- The password is validated client-side, so this provides basic protection but is not suitable for highly sensitive content
- Users must enter the password each time they open a new browser session
- The password is stored only as a GitHub secret and is not visible in the repository

## Changing the Password

To change the password:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Find the `GALLERY_PASSWORD` secret
3. Click **Update** and enter the new password
4. The next deployment will use the new password hash

## Testing

After setting up the secret:

1. Push a commit to trigger a new deployment
2. Wait for the GitHub Actions workflow to complete
3. Visit your gallery page
4. You should see a password prompt
5. Enter the password you set in the secret
6. The gallery content should be displayed

## Troubleshooting

- **Password prompt doesn't appear**: Check that the JavaScript file is included in the gallery page
- **Password always fails**: Verify that the `GALLERY_PASSWORD` secret is set correctly in GitHub
- **No password protection**: Check the GitHub Actions logs to see if the password hash was injected
