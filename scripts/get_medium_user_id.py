#!/usr/bin/env python3
"""
Helper script to get your Medium Author ID using your access token
"""

import os
import sys
import requests


def get_medium_user_info(access_token):
    """Get user information from Medium API"""
    url = "https://api.medium.com/v1/me"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error accessing Medium API: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Response: {e.response.text}")
        return None


def main():
    """Main function to get Medium user ID"""
    access_token = os.getenv('MEDIUM_ACCESS_TOKEN')
    
    if not access_token:
        print("❌ MEDIUM_ACCESS_TOKEN environment variable is required")
        print("   Get your token from: https://medium.com/me/settings")
        print("   Then run: export MEDIUM_ACCESS_TOKEN='your_token_here'")
        sys.exit(1)
    
    print("🔍 Fetching your Medium user information...")
    
    user_info = get_medium_user_info(access_token)
    
    if user_info and 'data' in user_info:
        data = user_info['data']
        print(f"\n✅ Success! Here's your Medium information:")
        print(f"   User ID: {data.get('id', 'Not found')}")
        print(f"   Username: {data.get('username', 'Not found')}")
        print(f"   Name: {data.get('name', 'Not found')}")
        print(f"   URL: {data.get('url', 'Not found')}")
        
        user_id = data.get('id')
        if user_id:
            print(f"\n🎯 Add this to your GitHub secrets:")
            print(f"   MEDIUM_AUTHOR_ID: {user_id}")
    else:
        print("❌ Failed to get user information. Please check your access token.")
        sys.exit(1)


if __name__ == "__main__":
    main()