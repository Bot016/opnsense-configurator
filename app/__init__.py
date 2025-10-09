from flask import Flask
import json
import os
import sys

from app.db import db

def create_app():
    app = Flask(__name__)

    # Read config.json
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    try:
        with open(config_path) as f:    
            config_data = json.load(f)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit()
        
    # Database setup
    app.config["SQLALCHEMY_DATABASE_URI"] = config_data.get("database_url", "sqlite:///app.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["UPLOAD_FOLDER"] = config_data.get("upload_folder", "uploads")
    app.config["MAX_CONTENT_LENGTH"] = config_data.get("max_content_length", 10 * 1024 * 1024)

    # Site name
    app.config['DISPLAY_NAME'] = config_data.get('display_name', 'None')
    
    # Create Upload folde
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    try:
        os.chmod(app.config["UPLOAD_FOLDER"], 0o700)
    except Exception:
        pass
    
    # Init DB and create tables
    db.init_app(app)
    with app.app_context():
        from app.models import FirewallBackup
        db.create_all()
    
    # Importa e registra as rotas (blueprints)
    from .routes.main import bp as main_bp
    from .routes.ipsec import bp as ipsec_bp
    from .routes.fw_backup import bp as fw_backup_bp
    from .routes.api import bp as api_bp 

    app.register_blueprint(main_bp)
    app.register_blueprint(ipsec_bp, url_prefix="/ipsec")
    app.register_blueprint(fw_backup_bp, url_prefix="/firewall-backup")
    app.register_blueprint(api_bp, url_prefix="/api")

    return app
