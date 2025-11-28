from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import json

app = Flask(__name__, static_folder="../", static_url_path="/")

SAVE_DIR = Path(__file__).parent / "saves"
SAVE_DIR.mkdir(exist_ok=True)

# Serve index.html and static files
@app.route("/")
def root():
    return app.send_static_file("index.html")

# List all saves
@app.route("/api/saves", methods=["GET"])
def list_saves():
    saves = []
    for file in SAVE_DIR.glob("slot_*.json"):
        try:
            data = json.loads(file.read_text())
            saves.append({
                "id": int(file.stem.split("_")[1]),
                "meta": data.get("meta", {}),
                "time": data.get("time", None)
            })
        except Exception:
            continue
    return jsonify(saves)

# Create or update a save
@app.route("/api/saves", methods=["POST"])
def save():
    payload = request.get_json(force=True)
    slot = int(payload.get("id", 1))
    data = payload.get("data", {})
    path = SAVE_DIR / f"slot_{slot}.json"
    path.write_text(json.dumps(data))
    return jsonify({"ok": True})

# Get a specific save
@app.route("/api/saves/<int:slot>", methods=["GET"])
def get_save(slot):
    path = SAVE_DIR / f"slot_{slot}.json"
    if not path.exists():
        return jsonify({"error": "Save not found"}), 404
    try:
        data = json.loads(path.read_text())
        return jsonify(data)
    except Exception:
        return jsonify({"error": "Invalid save format"}), 500

# Delete a save
@app.route("/api/saves/<int:slot>", methods=["DELETE"])
def delete_save(slot):
    path = SAVE_DIR / f"slot_{slot}.json"
    if path.exists():
        path.unlink()
    return jsonify({"ok": True})

# Import a save from raw JSON
@app.route("/api/saves/import", methods=["POST"])
def import_save():
    payload = request.get_json(force=True)
    slot = int(payload.get("id", 1))
    raw_json = payload.get("json", "{}")
    try:
        data = json.loads(raw_json)
        path = SAVE_DIR / f"slot_{slot}.json"
        path.write_text(json.dumps(data))
        return jsonify({"ok": True})
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

if __name__ == "__main__":
    app.run(debug=True)
