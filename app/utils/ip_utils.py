import ipaddress

class ipValidations:
    @staticmethod
    def is_valid_ip(ip: str) -> bool:
        try:
            ipaddress.IPv4Address(ip)
            return True
        except ipaddress.AddressValueError:
            return False
    
    @staticmethod
    def is_valid_subnet(subnet: str) -> bool:
        try:
            if "/" not in subnet:
                return False
            ipaddress.IPv4Network(subnet, strict=False)
            return True
        except (ipaddress.AddressValueError, ipaddress.NetmaskValueError, ValueError):
            return False
    
    @staticmethod
    def is_ip_in_network(ip: str, network: str) -> bool:
        try:
            ip_obj = ipaddress.IPv4Address(ip)
            network_obj = ipaddress.IPv4Network(network, strict=False)
            return ip_obj in network_obj
        except (ipaddress.AddressValueError, ipaddress.NetmaskValueError, ValueError):
            return False
    

    
    
