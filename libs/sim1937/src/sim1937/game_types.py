from dataclasses import dataclass
from enum import Enum


class Ideology(Enum):
    FASCIST = "Fascist/ファシスト"
    LIBERAL = "Liberal/自由主義"
    COMMUNIST = "Communist/共産主義"
    NEUTRAL = "Neutral/中立"


@dataclass
class RandomEvent:
    name_en: str
    name_ja: str
    desc: str
    code: str