import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "andersonnarciso@gmail.com"
AUTH_PASSWORD = "q1q2q3q4q5"
TIMEOUT = 30

def test_database_operations():
    """
    Test database connectivity and data persistence by:
    1. Creating a new test user record via API (assuming user management endpoint).
    2. Retrieving the created user.
    3. Updating the user's data.
    4. Deleting the user record.
    This will validate database connectivity and persistence through CRUD operations.
    """
    headers = {
        "Content-Type": "application/json"
    }

    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    # Sample user data for creation and update
    user_data_create = {
        "email": "test_database_ops@example.com",
        "password": "SecurePass123!",
        "name": "Test Database Ops",
        "role": "user"
    }

    user_data_update = {
        "name": "Test Database Ops Updated"
    }

    user_id = None

    try:
        # Create User
        response_create = requests.post(
            f"{BASE_URL}/api/users",
            json=user_data_create,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert response_create.status_code == 201, f"User creation failed: {response_create.text}"
        created_user = response_create.json()
        assert "id" in created_user, "Created user response missing 'id'"
        user_id = created_user["id"]

        # Retrieve User
        response_get = requests.get(
            f"{BASE_URL}/api/users/{user_id}",
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert response_get.status_code == 200, f"User retrieval failed: {response_get.text}"
        user = response_get.json()
        assert user.get("email") == user_data_create["email"], "Retrieved user email mismatch"
        assert user.get("name") == user_data_create["name"], "Retrieved user name mismatch"

        # Update User
        response_update = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json=user_data_update,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert response_update.status_code == 200, f"User update failed: {response_update.text}"
        updated_user = response_update.json()
        assert updated_user.get("name") == user_data_update["name"], "User name update failed"

        # Validate persistence by retrieving again after update
        response_get_after_update = requests.get(
            f"{BASE_URL}/api/users/{user_id}",
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert response_get_after_update.status_code == 200, f"User retrieval post-update failed: {response_get_after_update.text}"
        user_after_update = response_get_after_update.json()
        assert user_after_update.get("name") == user_data_update["name"], "Persisted user name mismatch after update"

    finally:
        # Cleanup - Delete the user if created
        if user_id:
            response_delete = requests.delete(
                f"{BASE_URL}/api/users/{user_id}",
                headers=headers,
                auth=auth,
                timeout=TIMEOUT
            )
            assert response_delete.status_code in (200, 204), f"User deletion failed: {response_delete.text}"

test_database_operations()