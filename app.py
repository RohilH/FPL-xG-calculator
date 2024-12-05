from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
from helpers import get_fpl_data, get_completed_gameweeks


app = Flask(__name__, static_folder="dist")
CORS(app)


@app.route("/api/gameweeks")
def get_gameweeks():
    """Get list of completed gameweeks"""
    completed = get_completed_gameweeks()
    return jsonify(
        {"gameweeks": [{"id": "season", "name": "Entire Season"}, *completed]}
    )


@app.route("/api/fpl-data")
def get_raw_fpl_data():
    try:
        data = get_fpl_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Serve React App
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(debug=True)
