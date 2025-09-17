from flask import current_app
import requests


def api_call(endpoint, method="GET", payload=None):
    config = current_app.config['CONFIG']
    auth = (config['api_key'], config['api_secret'])
    firewall = f"{config['firewall_ip']}:{config['web_port']}"
    url = f"https://{firewall}/api/{endpoint}"

    method = method.upper()
    allowed_methods = {"GET", "POST"}

    if method not in allowed_methods:
        raise ValueError(f"[ERROR] Invalid method '{method}'. Use GET or POST.")

    try:
        print(f"[INFO] Sending {method} request to: {url}")
        response = requests.request(
            method=method,
            url=url,
            json=payload if method == "POST" else None,
            verify=config['cert_path'],
            auth=auth,
            timeout=10 
        )
        response.raise_for_status()
        return response.json()

    except requests.exceptions.HTTPError as e:
        print(f"[ERROR] HTTP error: {e} - {response.text}")
    except requests.exceptions.ConnectionError as e:
        print(f"[ERROR] Connection error: {e}")
    except requests.exceptions.Timeout:
        print(f"[ERROR] Request timed out.")
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Unexpected error: {e}")

    raise SystemExit(1)