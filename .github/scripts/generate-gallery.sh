#!/bin/bash
# Script to generate gallery image HTML in index.qmd
# This script is run during CI/CD after images are copied from the private repo

set -e  # Exit on error

GALLERY_DIR="gallery"
IMAGES_DIR="${GALLERY_DIR}/images"
GALLERY_QMD="${GALLERY_DIR}/index.qmd"

echo "Generating gallery image HTML..."

# Check if images directory exists and has images
if [ ! -d "$IMAGES_DIR" ]; then
  echo "Error: Images directory not found at $IMAGES_DIR"
  exit 1
fi

# Count image files
IMAGE_COUNT=$(find "$IMAGES_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" -o -iname "*.svg" \) ! -name ".gitkeep" | wc -l)

if [ "$IMAGE_COUNT" -eq 0 ]; then
  echo "Warning: No images found in $IMAGES_DIR"
  echo "Gallery will be empty"
  # Don't exit with error, just leave the gallery empty
  exit 0
fi

echo "Found $IMAGE_COUNT images"

# Generate HTML for images
GALLERY_HTML=""
for img_path in "$IMAGES_DIR"/*.{jpg,jpeg,png,gif,webp,svg} "$IMAGES_DIR"/*.{JPG,JPEG,PNG,GIF,WEBP,SVG}; do
  # Skip if glob doesn't match any files (bash will leave the pattern as-is)
  [ -e "$img_path" ] || continue
  
  # Get just the filename
  img_file=$(basename "$img_path")
  
  # Skip .gitkeep
  [ "$img_file" = ".gitkeep" ] && continue
  
  # Add image tag with relative path
  GALLERY_HTML="${GALLERY_HTML}  <img src=\"images/${img_file}\" alt=\"Gallery image\" loading=\"lazy\">\n"
done

# Check if we have any HTML to insert
if [ -z "$GALLERY_HTML" ]; then
  echo "No valid images to insert"
  exit 0
fi

# Create temporary file with the updated content
TMP_FILE=$(mktemp)

# Read the original file and replace the empty gallery div
awk -v gallery_html="$GALLERY_HTML" '
  BEGIN { in_gallery = 0; gallery_replaced = 0 }
  /<div class="image-gallery">/ { 
    print $0
    printf "%s", gallery_html
    in_gallery = 1
    next
  }
  /<\/div>/ && in_gallery {
    print $0
    in_gallery = 0
    gallery_replaced = 1
    next
  }
  in_gallery { next }
  { print }
' "$GALLERY_QMD" > "$TMP_FILE"

# Replace original file with updated version
mv "$TMP_FILE" "$GALLERY_QMD"

echo "Gallery HTML generated successfully in $GALLERY_QMD"
echo "Images included: $IMAGE_COUNT"
