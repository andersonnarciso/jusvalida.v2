import requests

BASE_URL = "http://localhost:3000"
TIMEOUT = 30
HEADERS_JSON = {"Content-Type": "application/json"}

def test_api_authentication_endpoint():
    session = requests.Session()

    # Registration - create a test user
    register_payload = {
        "email": "andersonnarciso@gmail.com",
        "password": "q1q2q3q4q5"
    }
    try:
        register_response = session.post(
            f"{BASE_URL}/auth/register",
            json=register_payload,
            headers=HEADERS_JSON,
            timeout=TIMEOUT
        )
        # Registration might return 201 Created or 200 OK depending on implementation
        assert register_response.status_code in (200, 201), f"Registration failed: {register_response.text}"
        register_data = register_response.json()
        assert "id" in register_data or "user" in register_data, "Registration response missing user id info"

    except requests.exceptions.RequestException as e:
        # It is possible user already exists; So just print for now but continue test
        # For strict testing, could fail here, but we continue to test login & token validation
        print(f"Registration request error or user may already exist: {e}")

    # Login - authenticate with credentials
    login_payload = {
        "email": "andersonnarciso@gmail.com",
        "password": "q1q2q3q4q5"
    }
    login_response = session.post(
        f"{BASE_URL}/auth/login",
        json=login_payload,
        headers=HEADERS_JSON,
        timeout=TIMEOUT
    )
    assert login_response.status_code == 200, f"Login failed: {login_response.text}"
    login_data = login_response.json()
    assert "access_token" in login_data, "Login response missing access_token"
    access_token = login_data["access_token"]

    # Validate token - using token validation endpoint
    validate_headers = {
        "Authorization": f"Bearer {access_token}"
    }
    validate_response = session.get(
        f"{BASE_URL}/auth/validate-token",
        headers=validate_headers,
        timeout=TIMEOUT
    )
    assert validate_response.status_code == 200, f"Token validation failed: {validate_response.text}"
    validate_data = validate_response.json()
    assert validate_data.get("valid") is True, "Token is not valid according to validation endpoint"

test_api_authentication_endpoint()
