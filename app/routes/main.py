from flask import Blueprint, render_template, current_app

bp = Blueprint('main', __name__)

@bp.route('/')
def home():
    return render_template('index.html')
