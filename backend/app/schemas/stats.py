from pydantic import BaseModel


class GardenStats(BaseModel):
    total_reviews: int
    grapes: int
    bunches: int
    trees: int
