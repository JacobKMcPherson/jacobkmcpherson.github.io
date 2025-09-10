# Medium Integration Setup

This repository includes automatic Medium publishing for blog posts. When you push new or updated `.qmd` files to the `research/posts/` directory, they will be automatically published to your Medium account.

## Setup Instructions

### 1. Get Medium API Credentials

1. Go to [Medium Settings](https://medium.com/me/settings) → Integration tokens
2. Generate a new integration token
3. Note your Medium Author ID (you can get this from the Medium API or use your username as a fallback)

### 2. Configure GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, then add:

- `MEDIUM_ACCESS_TOKEN`: Your Medium integration token
- `MEDIUM_AUTHOR_ID`: Your Medium user ID

To get your Medium user ID, you can use the helper script:
```bash
export MEDIUM_ACCESS_TOKEN='your_token_here'
python scripts/get_medium_user_id.py
```

### 3. Blog Post Format

Your `.qmd` files should include proper frontmatter:

```yaml
---
title: "Your Blog Post Title"
author: "Jacob K. McPherson"
date: "2024-01-01"
categories: [category1, category2]
tags: [tag1, tag2]
---
```

### 4. Customization Options

You can customize the behavior by editing the environment variables in `.github/workflows/quarto-publish.yml`:

- `PUBLISH_STATUS`: Set to `"draft"` for testing, `"public"` for live posts, or `"unlisted"`
- `POSTS_DIRECTORY`: Change if your posts are in a different directory

### 5. How It Works

1. When you push to the main/master branch, the GitHub Action runs
2. The Quarto site is built as usual
3. The Medium publisher script scans for new or updated `.qmd` files
4. It converts them to Medium-compatible format and publishes via the Medium API
5. A record is kept in `scripts/.published_posts.json` to avoid republishing unchanged posts

### 6. Features

- **Duplicate Prevention**: Only publishes new or modified posts
- **Tag Conversion**: Automatically converts Quarto categories to Medium tags
- **Image Handling**: Converts relative image paths to absolute GitHub URLs
- **Error Handling**: Won't fail the site deployment if Medium publishing fails
- **Content Processing**: Removes Quarto-specific syntax that Medium doesn't support

### 7. Testing

To test the integration:

1. Set `PUBLISH_STATUS` to `"draft"` in the workflow file
2. Push a test post
3. Check your Medium drafts to see if it was published
4. Change back to `"public"` when ready for live posting

### 8. Troubleshooting

- Check the GitHub Actions logs for any error messages
- Ensure your Medium token is valid and has the right permissions
- Verify your Author ID is correct (should be the user ID, not username)
- Make sure your posts have valid frontmatter with at least a title