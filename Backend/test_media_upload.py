"""
Test script for media upload functionality
Run this after starting the backend server
"""
import requests
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/media"

def test_single_upload():
    """Test single file upload"""
    print("\n🧪 Testing Single File Upload...")
    
    # Create a test file
    test_file_path = "test_image.jpg"
    
    # Check if test file exists
    if not os.path.exists(test_file_path):
        print(f"❌ Test file not found: {test_file_path}")
        print("Please create a test image file or update the path")
        return
    
    files = {
        'file': open(test_file_path, 'rb')
    }
    data = {
        'user_id': 13,
        'tags': 'test,upload,single'
    }
    
    try:
        response = requests.post(f"{API_URL}/upload", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Single upload successful!")
                print(f"   ID: {result['data']['id']}")
                print(f"   File: {result['data']['file_name']}")
                print(f"   URL: {result['data']['file_url']}")
                print(f"   Size: {result['data']['file_size']} bytes")
                if result['data'].get('width') and result['data'].get('height'):
                    print(f"   Dimensions: {result['data']['width']}×{result['data']['height']}")
            else:
                print(f"❌ Upload failed: {result}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    finally:
        files['file'].close()


def test_multiple_upload():
    """Test multiple files upload"""
    print("\n🧪 Testing Multiple Files Upload...")
    
    # Test files
    test_files = ["test_image1.jpg", "test_image2.jpg"]
    
    # Check files
    existing_files = [f for f in test_files if os.path.exists(f)]
    
    if not existing_files:
        print(f"❌ No test files found")
        print("Please create test image files or update the paths")
        return
    
    print(f"Found {len(existing_files)} test files")
    
    files = [
        ('files', open(f, 'rb')) for f in existing_files
    ]
    data = {
        'user_id': 13,
        'tags': 'test,upload,multiple'
    }
    
    try:
        response = requests.post(f"{API_URL}/upload/multiple", files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Multiple upload successful!")
                print(f"   Uploaded: {result['uploaded']}")
                print(f"   Failed: {result['failed']}")
                
                if result['data']:
                    print("\n   Uploaded files:")
                    for item in result['data']:
                        print(f"   - {item['file_name']} (ID: {item['id']})")
                
                if result['errors']:
                    print("\n   Errors:")
                    for error in result['errors']:
                        print(f"   - {error['filename']}: {error['error']}")
            else:
                print(f"❌ Upload failed: {result}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
    finally:
        for _, f in files:
            f.close()


def test_get_all_media():
    """Test getting all media"""
    print("\n🧪 Testing Get All Media...")
    
    try:
        response = requests.get(f"{API_URL}/")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                media_count = len(result['data'])
                print(f"✅ Retrieved {media_count} media items")
                
                if media_count > 0:
                    print("\n   Recent uploads:")
                    for item in result['data'][:5]:  # Show first 5
                        print(f"   - {item['file_name']} ({item['file_type']}) - {item['file_size']} bytes")
            else:
                print(f"❌ Failed: {result}")
        else:
            print(f"❌ HTTP Error {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")


def test_server_connection():
    """Test if backend server is running"""
    print("\n🧪 Testing Server Connection...")
    
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Backend server is running!")
            print(f"   URL: {BASE_URL}")
            return True
        else:
            print(f"❌ Server responded with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend server")
        print(f"   Error: {str(e)}")
        print(f"   Make sure the backend is running at {BASE_URL}")
        return False


def main():
    print("=" * 60)
    print("🚀 Media Upload Test Suite")
    print("=" * 60)
    
    # Check server connection first
    if not test_server_connection():
        print("\n⚠️  Please start the backend server first:")
        print("   cd Backend")
        print("   python main.py")
        return
    
    # Run tests
    test_get_all_media()
    test_single_upload()
    test_multiple_upload()
    
    print("\n" + "=" * 60)
    print("✅ Test Suite Completed!")
    print("=" * 60)
    print("\n💡 Tips:")
    print("   - Update test file paths if needed")
    print("   - Check uploads in: Backend/uploads/")
    print("   - View API docs: http://localhost:8000/docs")
    print("   - Frontend URL: http://localhost:5173")


if __name__ == "__main__":
    main()
