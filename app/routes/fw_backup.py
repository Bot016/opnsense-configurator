from flask import Blueprint, render_template, current_app

bp = Blueprint('fw_backup', __name__)

@bp.route('/')
def fw_backup_home():
    config = current_app.config['CONFIG']
    display_name = config.get("display_name")
    return render_template('firewall-backup.html',display_name=display_name)