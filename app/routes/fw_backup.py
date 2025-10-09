from flask import Blueprint, render_template, current_app

bp = Blueprint('fw_backup', __name__)

@bp.route('/')
def fw_backup_home():
    return render_template('firewall-backup.html')