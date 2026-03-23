from datetime import date

from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    child_birthdate: date | None = None
