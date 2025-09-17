from flask import Blueprint, render_template, current_app

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    config = current_app.config['CONFIG']
    display_name = config.get("display_name") or None
    return render_template('index.html',display_name=display_name)
