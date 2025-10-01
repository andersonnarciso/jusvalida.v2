import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:3000"
USERNAME = "andersonnarciso@gmail.com"
PASSWORD = "q1q2q3q4q5"
TIMEOUT = 30


def test_file_upload_and_processing():
    session = requests.Session()
    session.auth = HTTPBasicAuth(USERNAME, PASSWORD)

    # Attempt to upload a valid file
    upload_url = f"{BASE_URL}/upload"
    file_content = b"""Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."""
    file_name = "test_document.txt"

    files = {
        "file": (file_name, file_content, "text/plain"),
    }

    upload_response = None
    document_id = None

    try:
        upload_response = session.post(upload_url, files=files, timeout=TIMEOUT)
        assert upload_response.status_code == 201 or upload_response.status_code == 200, \
            f"Unexpected upload status code: {upload_response.status_code}"
        json_resp = upload_response.json()
        assert "documentId" in json_resp or "id" in json_resp, "Response missing documentId"
        document_id = json_resp.get("documentId") or json_resp.get("id")
        assert isinstance(document_id, str) and len(document_id) > 0, "Invalid documentId returned"

        # Trigger processing of the uploaded document
        process_url = f"{BASE_URL}/upload/{document_id}/process"
        process_response = session.post(process_url, timeout=TIMEOUT)
        assert process_response.status_code == 200, f"Processing failed with status {process_response.status_code}"
        process_json = process_response.json()
        assert "status" in process_json, "Processing response missing status"
        assert process_json["status"] in ["processing", "completed"], "Unexpected processing status"

        # Optionally, get processing result if completed
        if process_json["status"] == "completed":
            result_url = f"{BASE_URL}/upload/{document_id}/result"
            result_response = session.get(result_url, timeout=TIMEOUT)
            assert result_response.status_code == 200, f"Result retrieval failed with status {result_response.status_code}"
            result_json = result_response.json()
            assert "analysis" in result_json or "result" in result_json, "Result missing analysis data"
            # Additional assertions could be added here depending on result structure

    finally:
        # Cleanup: delete uploaded document if API supports it
        if document_id:
            delete_url = f"{BASE_URL}/upload/{document_id}"
            try:
                delete_response = session.delete(delete_url, timeout=TIMEOUT)
                assert delete_response.status_code in [200, 204], \
                    f"Failed to delete uploaded document with status {delete_response.status_code}"
            except Exception:
                pass


test_file_upload_and_processing()