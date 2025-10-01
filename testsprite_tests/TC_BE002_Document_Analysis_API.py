import requests
import base64
import time

BASE_URL = "http://localhost:3000"
USERNAME = "andersonnarciso@gmail.com"
PASSWORD = "q1q2q3q4q5"
AUTH_TOKEN = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
HEADERS_AUTH = {
    "Authorization": f"Basic {AUTH_TOKEN}"
}
TIMEOUT = 30

def test_document_analysis_api():
    document_id = None
    try:
        # Step 1: Upload a document file for analysis
        upload_url = f"{BASE_URL}/analyses/upload"
        files = {
            # Simulate a simple text file upload with legal document content
            "file": ("test_document.txt", "Este é um documento legal para análise.", "text/plain")
        }
        response = requests.post(upload_url, headers=HEADERS_AUTH, files=files, timeout=TIMEOUT)
        assert response.status_code == 201, f"Upload failed: {response.status_code} - {response.text}"
        upload_data = response.json()
        assert "documentId" in upload_data, "Upload response missing documentId"
        document_id = upload_data["documentId"]

        # Step 2: Initiate document analysis specifying AI provider and template (assuming payload structure)
        analyze_url = f"{BASE_URL}/analyses/{document_id}/start"
        payload = {
            "aiProvider": "OpenAI GPT-5",
            "template": "Brazilian Legal Template"
        }
        headers = HEADERS_AUTH.copy()
        headers["Content-Type"] = "application/json"
        response = requests.post(analyze_url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 202, f"Analysis start failed: {response.status_code} - {response.text}"
        analysis_data = response.json()
        assert "analysisId" in analysis_data, "Analysis start response missing analysisId"
        analysis_id = analysis_data["analysisId"]

        # Step 3: Poll for analysis completion (simulate with retries)
        result_url = f"{BASE_URL}/analyses/{document_id}/result"
        analysis_result = None
        for _ in range(10):
            resp = requests.get(result_url, headers=HEADERS_AUTH, timeout=TIMEOUT)
            if resp.status_code == 200:
                res_data = resp.json()
                if res_data.get("status") == "completed":
                    analysis_result = res_data
                    break
                elif res_data.get("status") == "failed":
                    assert False, "Document analysis failed"
            elif resp.status_code == 202:
                # analysis still in progress
                time.sleep(3)
                continue
            else:
                assert False, f"Unexpected status fetching analysis result: {resp.status_code} - {resp.text}"
        assert analysis_result is not None, "Analysis did not complete in expected time"

        # Step 4: Validate fields in analysis result
        assert "summary" in analysis_result, "Analysis result missing summary"
        assert "recommendations" in analysis_result, "Analysis result missing recommendations"
        assert isinstance(analysis_result["summary"], str), "Summary should be a string"
        assert isinstance(analysis_result["recommendations"], list), "Recommendations should be a list"

    finally:
        # Cleanup: delete uploaded document analysis if document_id exists
        if document_id:
            delete_url = f"{BASE_URL}/analyses/{document_id}"
            try:
                del_resp = requests.delete(delete_url, headers=HEADERS_AUTH, timeout=TIMEOUT)
                assert del_resp.status_code in (200,204), f"Cleanup delete failed: {del_resp.status_code} - {del_resp.text}"
            except Exception as e:
                print(f"Error during cleanup deleting document analysis id {document_id}: {e}")

test_document_analysis_api()
