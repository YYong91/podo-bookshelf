def escape_like(value: str) -> str:
    """LIKE 패턴 특수문자(%, _, \\)를 이스케이프한다."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
