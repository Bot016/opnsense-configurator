from app.utils.ipsec_utils import IPsecValidator
from app.utils.backup_utils import BackupValidation
from flask import Blueprint, request, jsonify, current_app
from app.utils.firewall_utils import opnsenseUtils
from app.db import db
from app.models import FirewallBackup
from werkzeug.utils import secure_filename
import json, uuid, os

bp = Blueprint('api', __name__)

@bp.route('/ipsec/create', methods=['POST'])
def create_ipsec():
    """Endpoint for validate"""
    try:
        # Validate application/json
        if not request.is_json:
            return jsonify({
                'success': False,
                'message': 'Content-Type deve ser application/json'
            }), 400
        
        data = request.get_json()
        
        # Required data input validation
        is_valid, errors = IPsecValidator.validate_ipsec_data(data)
        if not is_valid:
            return jsonify({
                'success': False,
                'message': 'Dados inválidos',
                'errors': errors
            }), 400
        
        # Create Phase-2
        endpoint = "ipsec/connections/add_child"
        description = f"{data.get('client_name', '').strip()} - {data.get('keep_alive_ip', '').strip()}"
        payload= {
            "child":{
                "enabled":"1",
                "connection": data.get('tunnel_uuid', '').strip(),
                "sha256_96":"0",
                "mode":"tunnel",
                "policies":"1",
                "start_action":"none",
                "close_action":"none",
                "dpd_action":"clear",
                "reqid":"",
                "esp_proposals":"aes256gcm16-modp2048",
                "local_ts": data.get('local_subnet', '').strip(),
                "remote_ts": data.get('remote_subnet', '').strip(),
                "rekey_time":"3600",
                "description": description
            }
        }
        response_phase2 = opnsenseUtils.api_call(endpoint, method="POST", payload=payload)
        
        # Create Pre-Shared Key
        endpoint = "ipsec/pre_shared_keys/addItem"
        payload = {
            "preSharedKey": {
                "Key": data.get('psk', '').strip(),
                "description": data.get('client_name', '').strip(),
                "ident": data.get('local_identifier', '').strip(),
                "keyType": "PSK",
                "remote_ident": data.get('client_identifier', '').strip()
            }
        }
        opnsenseUtils.api_call(endpoint, method="POST", payload=payload)
        
        # Create SPD and NAT
        if data.get('nat_type', 'binat').strip() == "binat":
            local_subnet = opnsenseUtils.get_local_network()
            ipsec_interface = IPsecValidator.get_ipsec_interface_name()
            
            # Create SPD
            endpoint = "ipsec/manual_spd/add"
            payload = {
                "spd": {
                    "connection_child": response_phase2.get('uuid'),
                    "description": "",
                    "destination": "",
                    "enabled": "1",
                    "reqid": "",
                    "source": local_subnet
                }
            }
            opnsenseUtils.api_call(endpoint, method="POST", payload=payload)
            
            # Create NAT One to One
            endpoint = "firewall/one_to_one/add_rule"
            payload = {
                "rule": {
                    "enabled":"1",
                    "sequence":"1",
                    "log":"0",
                    "interface": ipsec_interface,
                    "type":"binat",
                    "external": data.get('local_subnet', '').strip(),
                    "source_not":"0",
                    "source_net": local_subnet,
                    "destination_not":"0",
                    "destination_net": data.get('remote_subnet', '').strip(),
                    "categories":"",
                    "natreflection":"",
                    "description": f"NAT {data.get('client_name', '').strip()}"
                }
            }
            opnsenseUtils.api_call(endpoint, method="POST", payload=payload)

        
        return jsonify({
            'success': True,
            'message': 'Configuração IPsec criada com sucesso',
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500

@bp.route('/backup/create', methods=['POST'])
def create_backup_schedule():
    form = request.form or request.json or {}

    is_valid, errors = BackupValidation.backupValidation(form, request.files)
    if not is_valid:
        return jsonify({'success': False, 'errors': errors}), 400

    platform = form.get('platform').strip().lower()
    name     = form.get('name').strip()
    host     = form.get('host').strip()
    port     = int(form.get('port'))

    schedule_raw = form.get('schedule')
    schedule = json.loads(schedule_raw) if isinstance(schedule_raw, str) else schedule_raw

    api_key = api_secret = username = password = None
    cert_pem_path = None

    if platform == 'opnsense':
        api_key    = form.get('api_key').strip()
        api_secret = form.get('api_secret').strip()

        # upload opcional/obrigatório conforme sua validação
        cert_file = request.files.get('tls_cert')
        if not cert_file or not cert_file.filename.lower().endswith('.pem'):
            return jsonify({'success': False, 'errors': ['Arquivo .pem é obrigatório']}), 400
        
        client_name = secure_filename(form.get('name', 'unkown_client'))
        unique = f"{client_name}-{uuid.uuid4().hex[:6]}.pem"
        save_path = os.path.join(current_app.config["UPLOAD_FOLDER"], unique)

        cert_file.save(save_path)
        cert_pem_path = save_path

    else:  # pfSense
        username = form.get('username').strip()
        password = form.get('password').strip()

    # UPSERT 
    fw = FirewallBackup.query.filter_by(platform=platform, host=host, port=port).first()
    if not fw:
        fw = FirewallBackup(
            platform=platform, name=name, host=host, port=port,
            api_key=api_key, api_secret=api_secret,
            username=username, password=password,
            cert_pem_path=cert_pem_path, schedule=schedule
        )
        db.session.add(fw)
    else:
        fw.name = name
        fw.api_key = api_key
        fw.api_secret = api_secret
        fw.username = username
        fw.password = password
        if cert_pem_path:
            fw.cert_pem_path = cert_pem_path
        fw.schedule = schedule

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Configuração criada/atualizada com sucesso',
        'firewall': fw.as_dict()
    }), 201
    
@bp.route("/backup/list", methods=["GET"])
def list_backups():
    """Retorna apenas o nome e o ID dos firewalls cadastrados."""
    firewalls = FirewallBackup.query.order_by(FirewallBackup.created_at.desc()).all()
    
    clients = [
        {"id": fw.id, "name": fw.name}
        for fw in firewalls
    ]

    return jsonify({
        "clients": clients,
    })

@bp.route("/backup/<int:client_id>", methods=["GET"])
def get_backup(client_id):
    fw = FirewallBackup.query.get_or_404(client_id)
    return jsonify(fw.as_dict())

@bp.route("/backup/<int:client_id>", methods=["PUT"])
def update_backup(client_id):
    fw = FirewallBackup.query.get_or_404(client_id)
    form = request.form or request.json or {}

    fw.name = form.get('name', fw.name)
    fw.host = form.get('host', fw.host)
    fw.port = int(form.get('port', fw.port))
    fw.platform = form.get('platform', fw.platform)
    fw.schedule = json.loads(form.get('schedule', json.dumps(fw.schedule)))

    if fw.platform == 'opnsense':
        fw.api_key = form.get('api_key', fw.api_key)
        fw.api_secret = form.get('api_secret', fw.api_secret)
    else:
        fw.username = form.get('username', fw.username)
        fw.password = form.get('password', fw.password)

    db.session.commit()
    return jsonify({'success': True, 'message': 'Cliente atualizado com sucesso'})

@bp.route("/backup/<int:client_id>", methods=["DELETE"])
def delete_backup(client_id):
    fw = FirewallBackup.query.get_or_404(client_id)
    db.session.delete(fw)
    db.session.commit()
    return jsonify({'success': True, 'message': f'Cliente {fw.name} excluído com sucesso'})