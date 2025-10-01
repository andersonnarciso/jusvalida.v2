import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH = HTTPBasicAuth("andersonnarciso@gmail.com", "q1q2q3q4q5")
HEADERS = {"Accept": "application/json"}
TIMEOUT = 30

def test_error_handling():
    try:
        # Test login with wrong credentials (expecting 401 Unauthorized or similar client error)
        resp = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "andersonnarciso@gmail.com", "password": "wrongpassword"},
            timeout=TIMEOUT,
        )
        assert resp.status_code in (400, 401, 403), "Expected 400, 401, or 403 for wrong credentials"
        json_resp = resp.json()
        assert any(k in json_resp for k in ["error", "errors", "message"]), "Error message expected in response body"

        # Test accessing a protected endpoint without auth (expecting 401)
        resp = requests.get(f"{BASE_URL}/analyses", timeout=TIMEOUT)
        assert resp.status_code == 401, "Expected 401 Unauthorized when no auth provided"

        # Test submission of invalid document analysis request (missing required fields)
        invalid_payload = {
            # empty or invalid structure simulating validation error
        }
        resp = requests.post(
            f"{BASE_URL}/analyses",
            auth=AUTH,
            headers={"Content-Type": "application/json"},
            json=invalid_payload,
            timeout=TIMEOUT,
        )
        assert resp.status_code == 400, "Expected 400 Bad Request for invalid analysis payload"
        json_resp = resp.json()
        assert "errors" in json_resp or "error" in json_resp, "Expected validation errors in response"

        # Test creating user with missing required fields to cause validation error
        invalid_user_payload = {
            "email": "",  # empty email to trigger validation error
            "password": "short",
        }
        resp = requests.post(
            f"{BASE_URL}/users",
            auth=AUTH,
            headers={"Content-Type": "application/json"},
            json=invalid_user_payload,
            timeout=TIMEOUT,
        )
        assert resp.status_code in (400, 422), "Expected client error status for invalid user creation"
        assert "error" in resp.json() or "errors" in resp.json(), "Expected error message for invalid user data"

        # Test unsupported HTTP method on a valid endpoint (e.g., PUT on landing page)
        resp = requests.put(f"{BASE_URL}/landing", auth=AUTH, timeout=TIMEOUT)
        assert resp.status_code in (405, 404), "Expected 405 Method Not Allowed or 404 Not Found for invalid HTTP method"

    except requests.RequestException as e:
        assert False, f"Request failed unexpectedly: {e}"

test_error_handling()
