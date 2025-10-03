# Fix CORS for Python Backend

Add this to your `server.py` file to enable CORS:

```python
from flask import Flask, request, jsonify
from flask_cors import CORS  # Add this import

app = Flask(__name__)
CORS(app)  # Add this line to enable CORS for all routes

# Or for more specific control:
# CORS(app, origins=["https://*.lovableproject.com", "http://localhost:*"])
```

## Install flask-cors:
```bash
pip3 install flask-cors
```

## Restart your server after adding CORS support.

Once CORS is enabled, the Business Owner column will display correctly as it's already properly configured in the frontend code.
