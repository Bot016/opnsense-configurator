from app.utils.ipsec_utils import IPsecValidator, get_local_network, get_ipsec_interface_name
from flask import Blueprint, request, jsonify
from app.utils.api_utils import api_call

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
        response_phase2 = api_call(endpoint, method="POST", payload=payload)
        
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
        api_call(endpoint, method="POST", payload=payload)
        
        # Create SPD and NAT
        if data.get('nat_type', 'binat').strip() == "binat":
            local_subnet = get_local_network()
            ipsec_interface = get_ipsec_interface_name()
            
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
            api_call(endpoint, method="POST", payload=payload)
            
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
            api_call(endpoint, method="POST", payload=payload)

        
        return jsonify({
            'success': True,
            'message': 'Configuração IPsec criada com sucesso',
            'config_id': 'exemplo-uuid-gerado',  # Substitua por ID real
            'data': data
        }), 201
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Erro interno do servidor: {str(e)}'
        }), 500
        
@bp.route('/backup/create', methods=['POST'])
def create_backup_schedule():
    data = request.get_json()
    print(data)