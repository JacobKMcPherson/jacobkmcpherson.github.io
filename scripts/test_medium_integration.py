#!/usr/bin/env python3
"""
Test script to validate Medium integration functionality
"""

import sys
import os
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from medium_publisher import MediumPublisher


def test_post_parsing():
    """Test that the script can correctly parse Quarto posts."""
    print("🧪 Testing post parsing functionality...")
    
    # Mock publisher for testing
    publisher = MediumPublisher("fake_token", "fake_user")
    posts_dir = Path("research/posts")
    
    if not posts_dir.exists():
        print("❌ Posts directory not found")
        return False
    
    qmd_files = list(posts_dir.glob("*.qmd"))
    if not qmd_files:
        print("❌ No .qmd files found")
        return False
    
    print(f"✅ Found {len(qmd_files)} .qmd files")
    
    for qmd_file in qmd_files:
        try:
            metadata, content = publisher.parse_qmd_post(qmd_file)
            
            title = metadata.get('title', 'No title')
            tags = publisher.extract_tags_from_categories(metadata)
            medium_content = publisher.qmd_to_medium_content(content)
            
            print(f"📝 Post: {qmd_file.name}")
            print(f"   Title: {title}")
            print(f"   Tags: {tags}")
            print(f"   Content length: {len(medium_content)} chars")
            print(f"   Has frontmatter: {'title' in metadata}")
            
        except Exception as e:
            print(f"❌ Error parsing {qmd_file.name}: {e}")
            return False
    
    print("✅ All posts parsed successfully!")
    return True


def test_duplicate_detection():
    """Test the duplicate detection functionality."""
    print("\n🧪 Testing duplicate detection...")
    
    publisher = MediumPublisher("fake_token", "fake_user")
    posts_dir = Path("research/posts")
    
    qmd_files = list(posts_dir.glob("*.qmd"))
    if not qmd_files:
        print("❌ No .qmd files found")
        return False
    
    test_file = qmd_files[0]
    
    # First check should return True (should publish)
    should_publish_1 = publisher.should_publish_post(test_file)
    print(f"✅ First check (new file): {should_publish_1}")
    
    # Simulate publishing by adding to published posts
    try:
        file_key = str(test_file.relative_to(Path.cwd()))
    except ValueError:
        file_key = str(test_file)
    
    publisher.published_posts[file_key] = {
        'hash': publisher.get_file_hash(test_file),
        'medium_id': 'fake_id',
        'published_at': '2024-01-01T00:00:00',
        'title': 'Test Post'
    }
    
    # Second check should return False (already published, unchanged)
    should_publish_2 = publisher.should_publish_post(test_file)
    print(f"✅ Second check (unchanged): {should_publish_2}")
    
    if should_publish_1 and not should_publish_2:
        print("✅ Duplicate detection working correctly!")
        return True
    else:
        print("❌ Duplicate detection failed")
        return False


def main():
    """Run all tests."""
    print("🚀 Running Medium integration tests...\n")
    
    os.chdir(Path(__file__).parent.parent)  # Change to repo root
    
    tests = [
        test_post_parsing,
        test_duplicate_detection
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Medium integration is ready.")
        return 0
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return 1


if __name__ == "__main__":
    sys.exit(main())