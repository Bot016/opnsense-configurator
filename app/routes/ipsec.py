from app.utils.ipsec_utils import IPsecValidator
from flask import Blueprint, render_template, current_app

bp = Blueprint('ipsec', __name__)

@bp.route('/')
def ipsec_home():
    config = current_app.config['CONFIG']
    default_local_subnet = config.get("default_local_subnet") or None
    default_local_identifier = config.get("default_local_identifier") or None
    display_name = config.get("display_name") or None
    
    tunnel_options = IPsecValidator.get_cached_tunnel_options()

    return render_template('ipsec.html', 
                        tunnel_options=tunnel_options, 
                        default_local_subnet=default_local_subnet, 
                        default_local_identifier=default_local_identifier,
                        display_name=display_name)
