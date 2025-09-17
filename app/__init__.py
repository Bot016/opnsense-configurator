from flask import Flask
import json
import os

def create_app():
    app = Flask(__name__)

    
    config_path = os.path.join(os.path.dirname(__file__), "config.json")
    with open(config_path) as f:
        app.config['CONFIG'] = json.load(f)

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
