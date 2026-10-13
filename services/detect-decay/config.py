from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    start_hour: int
    start_minute: int
    minimum_scans: int
    dry_run_email_mode: bool = False
    dry_run_log_mode: bool = False
    service_account_email: str | None = None
    email_template_id: str | None = None
