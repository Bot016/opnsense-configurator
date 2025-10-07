from app.utils.firewall_utils import opnsenseUtils
from app.utils.ip_utils import ipValidations
from typing import Dict, List, Tuple
from flask import g
import re

class IPsecValidator:
    @staticmethod
    def is_valid_identifier(identifier: str) -> bool:
        if ipValidations.is_valid_ip(identifier):
            return True
        
        email_pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
        if re.match(email_pattern, identifier):
            return True
        
        fqdn_pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
        if re.match(fqdn_pattern, identifier) and '.' in identifier:
            return True
        
        return False
    
    @staticmethod
    def is_valid_psk(psk: str) -> bool:
        if len(psk) < 56:
            return False

        pattern = r'^[ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789]+$'
        return bool(re.match(pattern, psk))
    
    @staticmethod
    def get_ipsec_interface_name():
        response = opnsenseUtils.api_call("firewall/one_to_one/get_rule")

        interfaces = response.get("rule", {}).get("interface", {})
        for iface_key, iface_data in interfaces.items():
            if iface_data.get("value") == 'IPsec':
                return iface_key
        
        return None
    
    @staticmethod
    def get_cached_tunnel_options():
        if not hasattr(g, 'tunnel_options'):
            endpoint = "ipsec/connections/search_connection"
            response = opnsenseUtils.api_call(endpoint)
            g.tunnel_options = [
                {"uuid": row["uuid"], "description": row["description"]}
                for row in response.get("rows", [])
            ]
        return g.tunnel_options

    @staticmethod
    def validate_ipsec_data(data: Dict) -> Tuple[bool, List[str]]:
        errors = []
        
        # Client name 
        client_name = data.get('client_name', '').strip()
        if not client_name:
            errors.append("Nome do cliente é obrigatório")
        elif '-' in client_name:
            errors.append("Nome do cliente não pode conter o caractere '-'")
        
        # Local subnet
        local_subnet = data.get('local_subnet', '').strip()
        if not local_subnet:
            errors.append("Local Subnet é obrigatório")
        elif not ipValidations.is_valid_subnet(local_subnet):
            errors.append("Local Subnet deve ser uma rede válida (ex: 192.168.1.0/24)")
        
        # Remote Subnet
        remote_subnet = data.get('remote_subnet', '').strip()
        if not remote_subnet:
            errors.append("Remote Subnet é obrigatório")
        elif not ipValidations.is_valid_subnet(remote_subnet):
            errors.append("Remote Subnet deve ser uma rede válida (ex: 10.1.30.0/24)")
        
        # Keep Alive IP
        keep_alive_ip = data.get('keep_alive_ip', '').strip()
        if not keep_alive_ip:
            errors.append("Keep Alive IP é obrigatório")
        elif not ipValidations.is_valid_ip(keep_alive_ip):
            errors.append("Keep Alive IP deve ser um endereço IP válido")
        elif (remote_subnet and ipValidations.is_valid_subnet(remote_subnet) and 
              not ipValidations.is_ip_in_network(keep_alive_ip, remote_subnet)):
            errors.append("Keep Alive IP deve estar dentro da rede do Remote Subnet")
        
        # Local identifier
        local_identifier = data.get('local_identifier', '').strip()
        if not local_identifier:
            errors.append("Local Identifier é obrigatório")
        elif not IPsecValidator.is_valid_identifier(local_identifier):
            errors.append("Local Identifier deve ser um IP, FQDN ou email válido")
        
        # Client identifier
        client_identifier = data.get('client_identifier', '').strip()
        if not client_identifier:
            errors.append("Client Identifier é obrigatório")
        elif not IPsecValidator.is_valid_identifier(client_identifier):
            errors.append("Client Identifier deve ser um IP, FQDN ou email válido")
        
        # PSK
        psk = data.get('psk', '').strip()
        if not psk:
            errors.append("Pre-Shared Key é obrigatória")
        elif not IPsecValidator.is_valid_psk(psk):
            if len(psk) < 56:
                errors.append("Pre-Shared Key deve ter no mínimo 56 caracteres")
            else:
                errors.append("Pre-Shared Key deve conter apenas letras e números")
        
        # Validação do tunnel UUID (se fornecido)
        tunnel_uuid = data.get('tunnel_uuid', '').strip()
        if tunnel_uuid:
            uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            if not re.match(uuid_pattern, tunnel_uuid, re.IGNORECASE):
                errors.append("UUID do túnel inválido")
            else:
                # Verifica se o UUID realmente existe no firewall
                try:
                    response = IPsecValidator.get_cached_tunnel_options()
                    valid_uuids = [row["uuid"] for row in response]
                    if tunnel_uuid not in valid_uuids:
                        errors.append("UUID do túnel errado")
                except Exception as e:
                    errors.append(f"UUID do túnel ")
        
        # Validação do tipo NAT
        nat_type = data.get('nat_type', '').strip()
        if nat_type and nat_type not in ['binat', 'no-nat']:
            errors.append("Tipo NAT deve ser 'binat' ou 'no-nat'")
        
        return len(errors) == 0, errors

