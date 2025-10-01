import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "andersonnarciso@gmail.com"
AUTH_PASSWORD = "q1q2q3q4q5"
TIMEOUT = 30


def test_credit_system_api():
    session = requests.Session()
    session.auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    # 1. Get current user credits
    credits_url = f"{BASE_URL}/api/credits"
    resp = session.get(credits_url, headers=headers, timeout=TIMEOUT)
    assert resp.status_code == 200, f"Expected 200 OK, got {resp.status_code}"
    credits_data = resp.json()
    assert isinstance(credits_data, dict), "Credits response is not a JSON object"
    assert "credits" in credits_data and isinstance(credits_data["credits"], (int, float)), "Credits field missing or invalid"

    # 2. Simulate purchase credits (billing endpoint)
    purchase_url = f"{BASE_URL}/api/billing/purchase"
    purchase_payload = {
        "plan_id": "basic_plan",
        "payment_method": "test_card",
        "amount": 1000,  # cents or currency smallest unit, depending on impl
    }
    purchase_resp = session.post(purchase_url, json=purchase_payload, headers=headers, timeout=TIMEOUT)
    assert purchase_resp.status_code in (200, 201), f"Expected 200 or 201, got {purchase_resp.status_code}"
    purchase_data = purchase_resp.json()
    assert "transaction_id" in purchase_data, "Missing transaction_id in purchase response"
    assert "status" in purchase_data and purchase_data["status"] in ["success", "pending"], "Unexpected purchase status"

    transaction_id = purchase_data.get("transaction_id")

    # 3. Retrieve transaction details
    transaction_url = f"{BASE_URL}/api/billing/transactions/{transaction_id}"
    transaction_resp = session.get(transaction_url, headers=headers, timeout=TIMEOUT)
    assert transaction_resp.status_code == 200, f"Expected 200 OK, got {transaction_resp.status_code}"
    transaction_data = transaction_resp.json()
    assert transaction_data.get("transaction_id") == transaction_id, "Transaction ID mismatch"
    assert transaction_data.get("amount") == purchase_payload["amount"], "Transaction amount mismatch"
    assert transaction_data.get("status") in ["success", "pending"], "Invalid transaction status"

    # 4. Attempt credit deduction for an analysis (simulate usage)
    deduct_url = f"{BASE_URL}/api/credits/deduct"
    deduct_payload = {
        "credits_to_deduct": 10,
        "reason": "document_analysis",
    }
    deduct_resp = session.post(deduct_url, json=deduct_payload, headers=headers, timeout=TIMEOUT)
    assert deduct_resp.status_code == 200, f"Expected 200 OK, got {deduct_resp.status_code}"
    deduct_data = deduct_resp.json()
    assert deduct_data.get("remaining_credits") is not None, "Missing remaining_credits after deduction"
    remaining_credits = deduct_data["remaining_credits"]
    assert remaining_credits <= credits_data["credits"] + (purchase_payload["amount"] / 100), "Remaining credits logic error"

    # 5. Attempt to deduct more credits than available to test error handling
    overdraft_payload = {
        "credits_to_deduct": remaining_credits + 1000,
        "reason": "overdraft_test",
    }
    overdraft_resp = session.post(deduct_url, json=overdraft_payload, headers=headers, timeout=TIMEOUT)
    assert overdraft_resp.status_code in (400, 403), f"Expected 400 or 403 for overdraft, got {overdraft_resp.status_code}"
    error_data = overdraft_resp.json()
    assert "error" in error_data or "message" in error_data, "Expected error message for overdraft"

    # 6. Get billing plans list
    plans_url = f"{BASE_URL}/api/billing/plans"
    plans_resp = session.get(plans_url, headers=headers, timeout=TIMEOUT)
    assert plans_resp.status_code == 200, f"Expected 200 OK, got {plans_resp.status_code}"
    plans_data = plans_resp.json()
    assert isinstance(plans_data, list), "Billing plans response should be a list"
    assert any("plan_id" in plan and "name" in plan and "price" in plan for plan in plans_data), "Billing plan data incomplete"


test_credit_system_api()