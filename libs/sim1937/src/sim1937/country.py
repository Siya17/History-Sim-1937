from dataclasses import dataclass, field
from typing import Set
from .game_types import Ideology
from .config import Config

@dataclass
class Country:
    name_en: str
    name_ja: str
    ideology: Ideology
    econ: int
    mil: int
    pol: int
    dip: int
    special_code: str # Determines what SPECIAL does
    special_used: bool = False
    allies: Set[str] = field(default_factory=set)
    vp_total: int = 0
    
    # State
    is_defeated: bool = False
    puppet_master: str = ""
    puppets_owned: Set[str] = field(default_factory=set)
    conquered_round: int = 0
    war_damage: int = 0  # Accumulated from losses

    @property
    def name_full(self): return f"{self.name_en} / {self.name_ja}"

    def mod_resource(self, res: str, amount: int, bonus_vp=False):
        if self.is_defeated and amount > 0: return 0
        current = getattr(self, res.lower())
        new_val = max(0, current + amount)
        
        # Cap at limit
        if new_val > Config.RESOURCE_CAP:
            overflow = new_val - Config.RESOURCE_CAP
            setattr(self, res.lower(), Config.RESOURCE_CAP)
            if bonus_vp and amount > 0:  # Positive gains only
                self.vp_total += overflow  # 1 overflow = 1 VP
            return overflow
        
        setattr(self, res.lower(), new_val)
        return 0
    
    def get_resource(self, res: str) -> int:
        return getattr(self, res.lower())