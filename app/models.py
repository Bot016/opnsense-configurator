from datetime import datetime
from app.db import db

class FirewallBackup(db.Model):
    __tablename__ = "firewalls_backup"

    id = db.Column(db.Integer, primary_key=True)

    # Identify
    platform = db.Column(db.String(20),  nullable=False, index=True)  # 'opnsense' | 'pfsense'
    name     = db.Column(db.String(100), nullable=False)
    host     = db.Column(db.String(255), nullable=False, index=True)
    port     = db.Column(db.Integer,     nullable=False)

    # OPNsense
    api_key       = db.Column(db.String(255), nullable=True)
    api_secret    = db.Column(db.String(255), nullable=True)
    cert_pem_path = db.Column(db.String(500), nullable=True)  # caminho do .pem salvo no disco

    # pfSense
    username = db.Column(db.String(255), nullable=True)
    password = db.Column(db.String(255), nullable=True)

    #schdule
    schedule = db.Column(db.JSON, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("platform", "host", "port", name="uq_firewall_platform_host_port"),
        db.Index("ix_firewalls_platform_host", "platform", "host"),
        db.Index("ix_firewalls_created_at", "created_at"),
    )

    def as_dict(self):
        return {
            "id": self.id,
            "platform": self.platform,
            "name": self.name,
            "host": self.host,
            "port": self.port,
            "schedule": self.schedule,
            "has_api_secret": bool(self.api_secret),
            "has_password": bool(self.password),
            "has_cert": bool(self.cert_pem_path),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<FirewallBackup {self.platform}:{self.host}:{self.port}>"