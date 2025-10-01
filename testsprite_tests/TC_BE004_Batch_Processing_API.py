import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
TIMEOUT = 30

auth = HTTPBasicAuth("andersonnarciso@gmail.com", "q1q2q3q4q5")

def test_batch_processing_api():
    batch_endpoint = f"{BASE_URL}/api/batch"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Example batch payload with multiple documents - simulate minimal viable structure
    batch_payload = {
        "documents": [
            {
                "title": "Contract Agreement",
                "content": "Este é um contrato de prestação de serviços...",
                "analysisType": "template-based",
                "aiProvider": "OpenAI GPT-5"
            },
            {
                "title": "Legal Notice",
                "content": "Notificação extrajudicial para contestação de dívida...",
                "analysisType": "template-based",
                "aiProvider": "Google Gemini 2.5 Pro"
            }
        ]
    }

    # Use try-finally to ensure cleanup if resource creation endpoint supports deletion
    created_batch_id = None
    try:
        # Submit batch processing request
        response = requests.post(
            batch_endpoint,
            json=batch_payload,
            headers=headers,
            auth=auth,
            timeout=TIMEOUT
        )
        assert response.status_code == 202, f"Expected 202 Accepted, got {response.status_code}"
        response_json = response.json()
        assert "batchId" in response_json, "Response JSON missing 'batchId'"
        created_batch_id = response_json["batchId"]

        # Poll for batch processing status with simple retry
        status_endpoint = f"{batch_endpoint}/{created_batch_id}/status"
        for _ in range(10):
            status_response = requests.get(status_endpoint, headers=headers, auth=auth, timeout=TIMEOUT)
            assert status_response.status_code == 200, f"Status check failed with {status_response.status_code}"
            status_json = status_response.json()
            status = status_json.get("status")
            assert status in ["pending", "processing", "completed", "failed"], f"Unexpected status: {status}"
            if status == "completed":
                break
            if status == "failed":
                raise AssertionError("Batch processing failed")
            # Wait before next status check
            import time
            time.sleep(2)
        else:
            raise TimeoutError("Batch processing did not complete within expected time")

        # Retrieve batch results
        results_endpoint = f"{batch_endpoint}/{created_batch_id}/results"
        results_response = requests.get(results_endpoint, headers=headers, auth=auth, timeout=TIMEOUT)
        assert results_response.status_code == 200, f"Expected 200 OK from results, got {results_response.status_code}"
        results_json = results_response.json()
        assert isinstance(results_json, dict), "Results response is not a dict"
        assert "documents" in results_json, "Results missing 'documents' key"
        assert len(results_json["documents"]) == len(batch_payload["documents"]), "Mismatch in number of documents processed"
        for doc_result in results_json["documents"]:
            assert "title" in doc_result and "analysis" in doc_result, "Each document result must have title and analysis"

    finally:
        # Attempt to delete the batch to clean up if API supports DELETE
        if created_batch_id:
            delete_endpoint = f"{batch_endpoint}/{created_batch_id}"
            try:
                del_response = requests.delete(delete_endpoint, headers=headers, auth=auth, timeout=TIMEOUT)
                # Accept 200 OK or 204 No Content on successful deletion
                assert del_response.status_code in (200, 204), f"Failed to delete batch, status code {del_response.status_code}"
            except Exception:
                # Log deletion failure but do not fail test due to cleanup issue
                pass

test_batch_processing_api()