from .game_types import RandomEvent 


EVENT_DECK = [
    RandomEvent("Market Crash", "市場暴落", "ALL -1 Econ / 全国-1経済", "CRASH"),
    RandomEvent("Tech Boom", "技術革新", "Econ ≥ 4 +1 Econ / 経済≥4の国+1経済", "TECH"),
    RandomEvent("Pandemic", "パンデミック", "ALL -1 Pol / 全国-1政治", "PANDEMIC"),
    RandomEvent("Peace Prize", "ノーベル平和賞", "ALL +1 Dip / 全国+1外交", "PEACE"),
    RandomEvent("Severe Winter", "厳冬", "Fascist/Communist -1 Mil / ファシスト・共産-1軍事", "WINTER"),
    RandomEvent("Labor Strikes", "労働ストライキ", "Liberal -1 Pol / 自由主義-1政治", "STRIKES"),
    RandomEvent("Coup Wave", "クーデターの波", "Pol < 5 -2 Pol / 政治<5の国-2政治", "COUP"),
    RandomEvent("Oil Discovery", "石油発見", "Random +2 Econ / ランダム+2経済", "OIL"),
    RandomEvent("Diplomatic Scandal", "外交スキャンダル", "ALL -1 Dip / 全国-1外交", "SCANDAL"),
    RandomEvent("Arms Race", "軍拡競争", "Mil > 5 +1 Mil / 軍事>5の国+1軍事", "ARMS"),
]


ACTIONS = {
    # BUILD
    "INDUSTRY": {"code": "BUILD_ECON", "cost": ("dip", 2), "gain": ("econ", 2)},
    "REARM":    {"code": "BUILD_MIL",  "cost": ("econ", 2), "gain": ("mil", 2)},
    "RALLY":    {"code": "BUILD_POL",  "cost": ("mil", 2),  "gain": ("pol", 2)},
    "DIPLOMACY":{"code": "BUILD_DIP",  "cost": ("pol", 2),  "gain": ("dip", 2)},

    # INTERACT
    "TRADE":    {"code": "ACT_TRADE",    "cost": ("dip", 1)},
    "ALLIANCE": {"code": "ACT_ALLIANCE", "cost": ("dip", "VARIES")},
    "BREAK":    {"code": "ACT_BREAK",    "cost": ("pol", 2)},
    "SABOTAGE": {"code": "ACT_SPY",      "cost": ("dip", 2)},
    "WAR":      {"code": "ACT_WAR",      "cost": ("mil", 2)},
    
    # SPECIAL (Restored)
    "SPECIAL":  {"code": "ACT_SPECIAL",  "cost": ("none", 0)}, 
}