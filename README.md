# Jacob K. McPherson's Personal Website

This is the source code for my personal website, built with [Quarto](https://quarto.org/) and deployed to GitHub Pages.

## Automatic Deployment

This website is automatically built and deployed using GitHub Actions whenever changes are pushed to the main branch. The workflow:

1. Sets up Quarto in the GitHub Actions environment
2. Renders the Quarto project to HTML
3. Deploys the generated content to GitHub Pages

## Local Development

To work with this site locally:

1. Install [Quarto](https://quarto.org/docs/get-started/)
2. Clone this repository
3. Run `quarto render` to build the site
4. Run `quarto preview` to preview the site locally

The rendered site will be in the `docs/` directory.

## Structure

- `*.qmd` files: Quarto markdown content files
- `_quarto.yml`: Quarto configuration
- `docs/`: Generated HTML output (deployed to GitHub Pages)
- `.github/workflows/`: GitHub Actions automation