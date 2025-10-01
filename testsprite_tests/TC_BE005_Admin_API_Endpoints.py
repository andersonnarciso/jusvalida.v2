import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

USERNAME = "andersonnarciso@gmail.com"
PASSWORD = "q1q2q3q4q5"

auth = HTTPBasicAuth(USERNAME, PASSWORD)
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json"
}

def test_admin_api_endpoints():
    # 1. Get list of users (Admin)
    users_resp = requests.get(f"{BASE_URL}/admin/users", auth=auth, headers=headers, timeout=TIMEOUT)
    assert users_resp.status_code == 200, f"Expected 200, got {users_resp.status_code}"
    users_data = users_resp.json()
    assert isinstance(users_data, list), "Users response should be a list"

    # Create a new user to test user management endpoints
    user_payload = {
        "email": "testuser1234@example.com",
        "password": "TestPass!234",
        "role": "user",
        "name": "Test User"
    }

    user_id = None
    try:
        create_resp = requests.post(f"{BASE_URL}/admin/users", json=user_payload, auth=auth, headers=headers, timeout=TIMEOUT)
        assert create_resp.status_code == 201, f"User creation failed with status {create_resp.status_code}"
        created_user = create_resp.json()
        user_id = created_user.get("id")
        assert user_id is not None, "Created user ID should not be None"
        assert created_user["email"] == user_payload["email"], "Created user email mismatch"
        assert created_user["role"] == user_payload["role"], "Created user role mismatch"

        # 2. Get user info by ID
        get_user_resp = requests.get(f"{BASE_URL}/admin/users/{user_id}", auth=auth, headers=headers, timeout=TIMEOUT)
        assert get_user_resp.status_code == 200, f"Get user failed with status {get_user_resp.status_code}"
        get_user_data = get_user_resp.json()
        assert get_user_data["email"] == user_payload["email"], "Get user email mismatch"

        # 3. Update the user role and name
        update_payload = {
            "role": "admin",
            "name": "Updated Test User"
        }
        update_resp = requests.put(f"{BASE_URL}/admin/users/{user_id}", json=update_payload, auth=auth, headers=headers, timeout=TIMEOUT)
        assert update_resp.status_code == 200, f"Update user failed with status {update_resp.status_code}"
        updated_user = update_resp.json()
        assert updated_user["role"] == "admin", "User role update failed"
        assert updated_user["name"] == "Updated Test User", "User name update failed"

        # 4. Test system configuration retrieval
        config_resp = requests.get(f"{BASE_URL}/admin/config", auth=auth, headers=headers, timeout=TIMEOUT)
        assert config_resp.status_code == 200, f"Get config failed with status {config_resp.status_code}"
        config_data = config_resp.json()
        assert isinstance(config_data, dict), "Config data should be a dictionary"

        # 5. Test system configuration update (patch/put)
        # Assuming config is updateable and expects some keys like 'system_mode'
        config_update_payload = {
            "system_mode": config_data.get("system_mode", "normal")
        }
        update_config_resp = requests.put(f"{BASE_URL}/admin/config", json=config_update_payload, auth=auth, headers=headers, timeout=TIMEOUT)
        assert update_config_resp.status_code == 200, f"Update config failed with status {update_config_resp.status_code}"
        updated_config = update_config_resp.json()
        assert "system_mode" in updated_config, "Updated config missing 'system_mode'"

    finally:
        # Clean up: delete created user if exists
        if user_id:
            del_resp = requests.delete(f"{BASE_URL}/admin/users/{user_id}", auth=auth, headers=headers, timeout=TIMEOUT)
            assert del_resp.status_code in (200, 204), f"User deletion failed with status {del_resp.status_code}"

test_admin_api_endpoints()