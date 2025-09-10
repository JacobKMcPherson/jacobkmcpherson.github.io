#!/usr/bin/env python3
"""
Medium Publisher for Quarto Blog Posts

This script automatically publishes Quarto blog posts to Medium using the Medium API.
It parses .qmd files, converts them to Medium-compatible format, and publishes them.
"""

import os
import sys
import json
import hashlib
import requests
import frontmatter
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class MediumPublisher:
    def __init__(self, access_token: str, author_id: str):
        """Initialize Medium publisher with API credentials."""
        self.access_token = access_token
        self.author_id = author_id
        self.base_url = "https://api.medium.com/v1"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        self.published_posts_file = Path("scripts/.published_posts.json")
        self.published_posts = self.load_published_posts()
    
    def load_published_posts(self) -> Dict:
        """Load the record of published posts to avoid duplicates."""
        if self.published_posts_file.exists():
            with open(self.published_posts_file, 'r') as f:
                return json.load(f)
        return {}
    
    def save_published_posts(self):
        """Save the record of published posts."""
        self.published_posts_file.parent.mkdir(exist_ok=True)
        with open(self.published_posts_file, 'w') as f:
            json.dump(self.published_posts, f, indent=2)
    
    def get_file_hash(self, file_path: Path) -> str:
        """Generate hash of file content to detect changes."""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return hashlib.md5(content.encode('utf-8')).hexdigest()
    
    def parse_qmd_post(self, file_path: Path) -> Tuple[Dict, str]:
        """Parse a Quarto markdown file and extract frontmatter and content."""
        with open(file_path, 'r', encoding='utf-8') as f:
            post = frontmatter.load(f)
        
        metadata = post.metadata
        content = post.content
        
        # Convert relative image paths to absolute GitHub URLs
        content = self.convert_image_paths(content, file_path)
        
        return metadata, content
    
    def convert_image_paths(self, content: str, file_path: Path) -> str:
        """Convert relative image paths to absolute GitHub URLs."""
        # This is a basic implementation - could be enhanced for more complex cases
        repo_base = "https://raw.githubusercontent.com/JacobKMcPherson/jacobkmcpherson.github.io/main"
        
        # Simple regex replacement for common markdown image syntax
        import re
        
        def replace_image_path(match):
            path = match.group(1)
            if path.startswith('http'):
                return match.group(0)  # Already absolute URL
            
            # Convert relative path to absolute GitHub URL
            if path.startswith('/'):
                return f"![{match.group(0).split('](')[0][2:]}]({repo_base}{path})"
            else:
                # Relative to the post file
                relative_dir = file_path.parent.relative_to(Path.cwd())
                return f"![{match.group(0).split('](')[0][2:]}]({repo_base}/{relative_dir}/{path})"
        
        content = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', replace_image_path, content)
        return content
    
    def qmd_to_medium_content(self, content: str) -> str:
        """Convert Quarto markdown content to Medium-compatible HTML."""
        # For now, Medium API accepts markdown, so we'll use that
        # Could be enhanced to convert to HTML if needed
        
        # Remove Quarto-specific syntax that Medium doesn't support
        lines = content.split('\n')
        processed_lines = []
        
        for line in lines:
            # Skip Quarto callouts and other special syntax
            if line.strip().startswith(':::{'):
                continue
            if line.strip() == ':::':
                continue
            
            processed_lines.append(line)
        
        return '\n'.join(processed_lines)
    
    def extract_tags_from_categories(self, metadata: Dict) -> List[str]:
        """Extract Medium tags from Quarto categories."""
        categories = metadata.get('categories', [])
        tags = metadata.get('tags', [])
        
        # Combine categories and tags, limit to Medium's 5 tag limit
        all_tags = []
        if isinstance(categories, list):
            all_tags.extend(categories)
        elif isinstance(categories, str):
            all_tags.append(categories)
        
        if isinstance(tags, list):
            all_tags.extend(tags)
        elif isinstance(tags, str):
            all_tags.append(tags)
        
        # Clean and limit tags
        clean_tags = []
        for tag in all_tags:
            if isinstance(tag, str):
                clean_tag = tag.strip().replace('-', ' ').replace('_', ' ')
                if clean_tag and len(clean_tag) <= 25:  # Medium tag length limit
                    clean_tags.append(clean_tag)
        
        return clean_tags[:5]  # Medium allows max 5 tags
    
    def should_publish_post(self, file_path: Path) -> bool:
        """Check if a post should be published (new or updated)."""
        try:
            file_key = str(file_path.relative_to(Path.cwd()))
        except ValueError:
            # Handle case where file_path is not relative to cwd
            file_key = str(file_path)
        current_hash = self.get_file_hash(file_path)
        
        if file_key not in self.published_posts:
            return True
        
        return self.published_posts[file_key]['hash'] != current_hash
    
    def publish_to_medium(self, title: str, content: str, tags: List[str], 
                         publish_status: str = "draft") -> Optional[str]:
        """Publish a post to Medium and return the post ID."""
        url = f"{self.base_url}/users/{self.author_id}/posts"
        
        data = {
            "title": title,
            "contentFormat": "markdown",
            "content": content,
            "tags": tags,
            "publishStatus": publish_status,  # "public", "draft", or "unlisted"
            "notifyFollowers": False  # Don't spam followers during testing
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            return result.get('data', {}).get('id')
            
        except requests.exceptions.RequestException as e:
            print(f"Error publishing to Medium: {e}")
            if hasattr(e.response, 'text'):
                print(f"Response: {e.response.text}")
            return None
    
    def process_blog_posts(self, posts_dir: Path, publish_status: str = "draft") -> int:
        """Process all blog posts in the specified directory."""
        if not posts_dir.exists():
            print(f"Posts directory {posts_dir} does not exist")
            return 0
        
        published_count = 0
        qmd_files = list(posts_dir.glob("*.qmd"))
        
        print(f"Found {len(qmd_files)} .qmd files in {posts_dir}")
        
        for qmd_file in qmd_files:
            print(f"\nProcessing: {qmd_file.name}")
            
            if not self.should_publish_post(qmd_file):
                print(f"Skipping {qmd_file.name} - already published and unchanged")
                continue
            
            try:
                metadata, content = self.parse_qmd_post(qmd_file)
                
                title = metadata.get('title', qmd_file.stem)
                if not title or title.strip() == '':
                    print(f"Skipping {qmd_file.name} - no title found")
                    continue
                
                # Convert content for Medium
                medium_content = self.qmd_to_medium_content(content)
                tags = self.extract_tags_from_categories(metadata)
                
                print(f"Title: {title}")
                print(f"Tags: {tags}")
                print(f"Content length: {len(medium_content)} characters")
                
                # Publish to Medium
                post_id = self.publish_to_medium(title, medium_content, tags, publish_status)
                
                if post_id:
                    print(f"✅ Successfully published: {title} (ID: {post_id})")
                    
                    # Record the successful publication
                    try:
                        file_key = str(qmd_file.relative_to(Path.cwd()))
                    except ValueError:
                        file_key = str(qmd_file)
                    self.published_posts[file_key] = {
                        'hash': self.get_file_hash(qmd_file),
                        'medium_id': post_id,
                        'published_at': datetime.now().isoformat(),
                        'title': title
                    }
                    published_count += 1
                else:
                    print(f"❌ Failed to publish: {title}")
                    
            except Exception as e:
                print(f"❌ Error processing {qmd_file.name}: {e}")
        
        # Save the updated published posts record
        self.save_published_posts()
        return published_count


def main():
    """Main function to run the Medium publisher."""
    # Get configuration from environment variables
    access_token = os.getenv('MEDIUM_ACCESS_TOKEN')
    author_id = os.getenv('MEDIUM_AUTHOR_ID', 'jacobkmcpherson')  # Default to username, but should be user ID
    posts_dir = os.getenv('POSTS_DIRECTORY', 'research/posts')
    publish_status = os.getenv('PUBLISH_STATUS', 'draft')  # draft, public, or unlisted
    
    if not access_token:
        print("❌ MEDIUM_ACCESS_TOKEN environment variable is required")
        sys.exit(1)
    
    print("🚀 Starting Medium publisher...")
    print(f"Posts directory: {posts_dir}")
    print(f"Publish status: {publish_status}")
    print(f"Author ID: {author_id}")
    
    try:
        publisher = MediumPublisher(access_token, author_id)
        posts_path = Path(posts_dir)
        
        published_count = publisher.process_blog_posts(posts_path, publish_status)
        
        if published_count > 0:
            print(f"\n✅ Successfully published {published_count} post(s) to Medium!")
        else:
            print(f"\n📝 No new posts to publish")
            
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()