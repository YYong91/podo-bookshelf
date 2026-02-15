from tsidpy import TSID


def generate_tsid() -> int:
    return TSID.create().number
