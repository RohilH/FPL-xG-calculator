from enum import Enum


class Position(Enum):
    GK = 1
    DEF = 2
    MID = 3
    FWD = 4

    @property
    def goal_points(self) -> int:
        """Points awarded for scoring a goal"""
        return {Position.GK: 6, Position.DEF: 6, Position.MID: 5, Position.FWD: 4}[self]

    @property
    def clean_sheet_points(self) -> int:
        """Points awarded for a clean sheet"""
        return {Position.GK: 4, Position.DEF: 4, Position.MID: 1, Position.FWD: 0}[self]

    @classmethod
    def from_element_type(cls, element_type: int) -> "Position":
        """Convert FPL element_type to Position enum"""
        try:
            return cls(element_type)
        except ValueError:
            raise ValueError(f"Invalid element_type: {element_type}")
