import json
import os
import sys
import uuid
import urllib.request


BASE_URL = os.getenv("NETIFY_BASE_URL", "http://localhost:3002").rstrip("/")
API_KEY = os.getenv("NETIFY_API_KEY")
JOB_ID = os.getenv("JOB_ID", str(uuid.uuid4()))
PDF_URL = os.getenv("PDF_URL")
USER_ID = os.getenv("USER_ID", "demo-user")
PROMPT = os.getenv("NETIFY_PROMPT", "Create a clear narrated training video.")


def request(url, method="GET", body=None, stream=False):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    if body is not None:
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers=headers,
        method=method,
    )
    return urllib.request.urlopen(req, timeout=None if stream else 60)


if not API_KEY:
    print("Set NETIFY_API_KEY to your Netify API key.", file=sys.stderr)
    sys.exit(1)

if not PDF_URL:
    print("Set PDF_URL to a public or signed PDF URL.", file=sys.stderr)
    sys.exit(1)


start = request(
    f"{BASE_URL}/api/render",
    method="POST",
    body={
        "jobId": JOB_ID,
        "pdfUrl": PDF_URL,
        "userId": USER_ID,
        "prompt": PROMPT,
    },
)

print("Job accepted:", start.read().decode("utf-8"))
print(f"Streaming progress for {JOB_ID}")

events = request(f"{BASE_URL}/api/events/{JOB_ID}", stream=True)

for raw in events:
    line = raw.decode("utf-8").strip()
    if not line.startswith("data: "):
        continue

    event = json.loads(line[6:])
    print(f"{event['pct']}% {event['message']}")

    if event["pct"] == 100:
        print("Done. Retrieve the final MP4 from your configured video storage.")
        break

    if event["pct"] < 0:
        raise RuntimeError(event["message"])
