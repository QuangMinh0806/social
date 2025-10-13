"""
Test script for Employee Management API
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/users"

def test_get_all_users():
    """Test getting all users"""
    print("\n=== Test: Get All Users ===")
    response = requests.get(BASE_URL)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_search_users(search_term):
    """Test searching users"""
    print(f"\n=== Test: Search Users ('{search_term}') ===")
    response = requests.get(f"{BASE_URL}?search={search_term}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_filter_by_role(role):
    """Test filtering by role"""
    print(f"\n=== Test: Filter by Role ('{role}') ===")
    response = requests.get(f"{BASE_URL}?role={role}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_filter_by_status(status):
    """Test filtering by status"""
    print(f"\n=== Test: Filter by Status ('{status}') ===")
    response = requests.get(f"{BASE_URL}?status={status}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_create_user(user_data):
    """Test creating a new user"""
    print("\n=== Test: Create User ===")
    response = requests.post(BASE_URL, json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_update_user(user_id, update_data):
    """Test updating a user"""
    print(f"\n=== Test: Update User (ID: {user_id}) ===")
    response = requests.put(f"{BASE_URL}/{user_id}", json=update_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_get_user_by_id(user_id):
    """Test getting user by ID"""
    print(f"\n=== Test: Get User by ID ({user_id}) ===")
    response = requests.get(f"{BASE_URL}/{user_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

def test_delete_user(user_id):
    """Test deleting a user"""
    print(f"\n=== Test: Delete User (ID: {user_id}) ===")
    response = requests.delete(f"{BASE_URL}/{user_id}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.json()

if __name__ == "__main__":
    print("=" * 60)
    print("EMPLOYEE MANAGEMENT API TEST")
    print("=" * 60)

    # Test 1: Get all users
    all_users = test_get_all_users()

    # Test 2: Search users
    test_search_users("admin")

    # Test 3: Filter by role
    test_filter_by_role("Admin")

    # Test 4: Filter by status
    test_filter_by_status("active")

    # Test 5: Create new user
    new_user_data = {
        "username": "testemployee",
        "email": "testemployee@techcorp.com",
        "password_hash": "hashed_password_here",
        "full_name": "Test Employee",
        "role": "Content Editor",
        "status": "active"
    }
    created_user = test_create_user(new_user_data)

    # Test 6: Get user by ID (if user was created)
    if created_user.get("success") and created_user.get("data"):
        user_id = created_user["data"]["id"]
        test_get_user_by_id(user_id)

        # Test 7: Update user
        update_data = {
            "full_name": "Updated Test Employee",
            "role": "Social Media Specialist"
        }
        test_update_user(user_id, update_data)

        # Test 8: Delete user (comment out if you want to keep test data)
        # test_delete_user(user_id)

    # Test 9: Combined filters
    print("\n=== Test: Combined Filters (search + role + status) ===")
    response = requests.get(f"{BASE_URL}?search=admin&role=Admin&status=active")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

    print("\n" + "=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)
