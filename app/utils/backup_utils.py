from app.utils.ip_utils import ipValidations
from datetime import datetime
import json

class BackupValidation:
    @staticmethod
    def backupValidation(data):
        errors = []
        is_valid = False
        print(data)
        
        # Verify plataform name
        plataform = data.get('platform', '').strip()
        if plataform not in ('opnsense', 'pfsense'):
            errors.append("Plataforma tem que ser OPNsense ou PFsense")
        elif plataform == 'pfsense':
            username = data.get('username', '').strip()
            password = data.get('password', '').strip()
            if not username or not password:
                errors.append("Insira o Usuário ou Senha")
        elif plataform == 'opnsense':
            api_key = data.get('api_key', '').strip()
            api_secret = data.get('api_secret', '').strip()
            if not api_key or not api_secret:
                errors.append("Insira a API KEY ou API SECRET")
            
        
        # Verify client name
        client_name = data.get('name', '').strip()
        if not client_name:
            errors.append("O nome do cliente não pode estar vazio")
        
        # Verify IP
        firewall_ip = data.get('host', '').strip()
        if not firewall_ip:
            errors.append("IP do Firewall é obrigatório")
        elif not ipValidations.is_valid_ip(firewall_ip):
            errors.append("IP do Firewall deve ser um IP válido (ex: 192.168.1.1)")

        # Verify Port
        firewall_port = data.get('port', '').strip()
        if firewall_port in range(1, 65535):
            errors.append("A porta deve estar no range")
        
        # Verify Schedule
        schedule_raw = data.get('schedule', '{}')
        try:
            schedule = json.loads(schedule_raw)
        except Exception:
            errors.append("Formato de agendamento inválido.")
            schedule = {}

        # Verify time
        time_str = schedule.get('time', '').strip()
        try:
            datetime.strptime(time_str, "%H:%M")
        except ValueError:
            errors.append("O horário deve estar no formato HH:MM entre 00:00 e 23:59.")
        
        # Veryfy schedule type and weekend days
        schedule_type = schedule.get('type', '').strip()
        if schedule_type not in ('daily', 'weekly'):
            errors.append("O Schedule precisa ser Daily ou Weekly")
        else:
            if schedule_type == 'weekly':
                schedule_days = schedule.get("days", [])

                if isinstance(schedule_days, str):
                    schedule_days = [schedule_days]

                if not schedule_days:
                    errors.append("É necessário selecionar pelo menos um dia da semana.")
                else:
                    allowed_days = {'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'}
                    invalid_days = [d for d in schedule_days if d not in allowed_days]
                    if invalid_days:
                        errors.append(f"Dias inválidos: {', '.join(invalid_days)}")
                    
        
        return is_valid, errors 
