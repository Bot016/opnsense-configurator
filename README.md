# opnsense-configurator

# Configuração do Sistema

Abaixo está um modelo de configuração em formato **JSON** utilizado para definir parâmetros de autenticação, rede e sistema.

```json
{
    "api_key": "EXEMPLO",
    "api_secret": "EXEMPLO",
    "cert_path": "./app/OPNsense.pem",
    "firewall_ip": "192.168.0.1",
    "web_port": "443",
    "default_local_identifier": "exemplo@ipsec.com",
    "default_local_subnet": "172.16.0.0/24",
    "display_name": "NAME OF APP",
    "database_url": "sqlite:///app.db",
    "upload_folder": "uploads",
    "MAX_CONTENT_LENGTH": 10485760
}
