import random
import time
from typing import Dict, Optional
from .config import Config
from .country import Country
from .game_types import Ideology
from .const import EVENT_DECK, ACTIONS


class RoundTimer:
    def __init__(self, duration):
        self.start_time = time.time()
        self.duration = duration
    
    def get_time_left(self):
        return max(0, int(self.duration - (time.time() - self.start_time)))


class GameEngine:
    def __init__(self):
        self.world: Dict[str, Country] = {}
        self.current_round = 1
        self.timer = RoundTimer(Config.ROUND_DURATION_SEC)
        self.events_buffer = [] 
        self._init_world()

    def _init_world(self):
        # Added SPECIAL CODES from V19
        setup = [
            ("Germany", "ドイツ", Ideology.FASCIST, 6, 8, 6, 4, "GER_REARM"),
            ("Japan",   "日本",   Ideology.FASCIST, 5, 7, 5, 4, "JPN_EXPAND"),
            ("Italy",   "イタリア", Ideology.FASCIST, 5, 6, 5, 5, "ITA_RALLY"),
            ("Spain",   "スペイン", Ideology.FASCIST, 4, 4, 3, 3, "ESP_REBUILD"),
            ("UK",      "イギリス", Ideology.LIBERAL, 8, 6, 7, 7, "UK_BLOCKADE"),
            ("France",  "フランス", Ideology.LIBERAL, 6, 5, 5, 6, "FRA_MAGINOT"),
            ("USA",     "アメリカ", Ideology.LIBERAL, 9, 4, 6, 5, "USA_AID"),
            ("China",   "中国",    Ideology.LIBERAL, 4, 5, 5, 4, "CHN_GUERRILLA"),
            ("Poland",  "ポーランド", Ideology.LIBERAL, 5, 5, 5, 4, "POL_MOBILIZE"),
            ("Czech",   "チェコ",   Ideology.LIBERAL, 5, 5, 5, 4, "CZE_FORTIFY"),
            ("USSR",    "ソ連",    Ideology.COMMUNIST, 6, 8, 7, 3, "USSR_ARMY"),
            ("Turkey",  "トルコ",   Ideology.NEUTRAL, 5, 4, 5, 5, "TUR_BOSPHORUS"),
            ("Austria", "オーストリア", Ideology.NEUTRAL, 4, 3, 3, 4, "AUT_DIPLOMACY"),
            ("Iran",    "イラン",   Ideology.NEUTRAL, 4, 3, 4, 4, "IRN_OIL"),
        ]
        for en, ja, ideo, e, m, p, d, spec in setup:
            c = Country(en, ja, ideo, e, m, p, d, spec)
            self.world[en] = c
            self.world[ja] = c

    def get_country(self, name: str) -> Optional[Country]:
        if not name: return None
        clean = name.split('/')[0].strip().lower()
        for c in self.world.values():
            if clean == c.name_en.lower() or name == c.name_ja: return c
        return None
    
    @property
    def unique_countries(self):
        return list({c.name_en: c for c in self.world.values()}.values())

    def log_event(self, event_en: str, event_ja: str):
        self.events_buffer.append(f"{event_en} / {event_ja}")

    def liberate_cascade(self, country, liberator):
        """Recursively liberate puppets and their puppets."""
        liberated = []
        
        for puppet_name in list(country.puppets_owned):
            puppet = self.get_country(puppet_name)
            if puppet and puppet.is_defeated:
                puppet.is_defeated = False
                puppet.puppet_master = ""
                puppet.war_damage = 0
                bonus = min(4, self.current_round - puppet.conquered_round)
                puppet.mod_resource("econ", bonus)
                puppet.mod_resource("mil", 2)
                puppet.mod_resource("pol", 2)
                liberator.allies.add(puppet.name_en)
                puppet.allies.add(liberator.name_en)
                liberated.append(puppet.name_en)
                
                # Liberate THIS puppet's puppets too
                liberated.extend(self.liberate_cascade(puppet, liberator))
        
        country.puppets_owned.clear()
        return liberated

    # --- AUTOMATIC EVENT LOGIC ---
    def trigger_round_event(self):
        """Called at start of round. Guaranteed random event.""" 
        
        event = random.choice(EVENT_DECK)
        self.log_event(f"EVENT: {event.name_en} / イベント: {event.name_ja}", f"Effect: {event.desc}")
        
        # Apply Effects immediately (No Resolve needed)
        for c in self.unique_countries:
            if c.is_defeated: continue
            
            if event.code == "CRASH":
                c.mod_resource("econ", -1)
            elif event.code == "PANDEMIC":
                c.mod_resource("pol", -1)
            elif event.code == "TECH":
                if c.econ >= 4: c.mod_resource("econ", 1)
            elif event.code == "PEACE":
                c.mod_resource("dip", 1)
            elif event.code == "WINTER":
                if c.ideology == Ideology.FASCIST or c.ideology == Ideology.COMMUNIST:
                    c.mod_resource("mil", -1)
            elif event.code == "STRIKES":
                if c.ideology == Ideology.LIBERAL:
                    c.mod_resource("pol", -1)
            elif event.code == "COUP":
                if c.pol < 5: c.mod_resource("pol", -2)
            elif event.code == "SCANDAL":
                c.mod_resource("dip", -1)
            elif event.code == "ARMS":
                if c.mil > 5: c.mod_resource("mil", 1)
        
        # Single Target Events
        if event.code == "OIL":
            lucky = random.choice(self.unique_countries)
            if not lucky.is_defeated:
                lucky.mod_resource("econ", 2)
                self.log_event(f"Oil found in {lucky.name_en}", f"{lucky.name_ja}で石油発見")

    # --- TURN PROCESSING ---
    def process_turn(self, actor_name: str, action_raw: str, target_name: str = ""):
        actor = self.get_country(actor_name)
        target = self.get_country(target_name)

        if not actor: return "⚠️ Error: Unknown Actor / 不明な国"
        if actor.is_defeated: return f"🔴 ELIMINATED (Puppet of {actor.puppet_master}) / 敗退 (属国)"

        action_def = None
        for k, v in ACTIONS.items():
            if k in action_raw.upper() or ("code" in v and v["code"] in action_raw):
                action_def = v
                break
        if not action_def:
            jp_map = {"産業": "INDUSTRY", "軍備": "REARM", "宣伝": "RALLY", "外交": "DIPLOMACY", 
                      "貿易": "TRADE", "同盟": "ALLIANCE", "破棄": "BREAK", "妨害": "SABOTAGE", "宣戦": "WAR", "特殊": "SPECIAL"}
            for jp, en in jp_map.items():
                if jp in action_raw: action_def = ACTIONS[en]; break
        
        if not action_def: return "⚠️ Invalid Action / 無効なアクション"

        code = action_def["code"]

        # 1. SPECIAL ACTION (Restored)
        if code == "ACT_SPECIAL":
            if actor.special_used: return "⚠️ Special already used / 特殊能力は使用済み"
            actor.special_used = True
            
            spec = actor.special_code
            if "REARM" in spec or "ARMY" in spec:
                actor.mod_resource("mil", 2)
                return "⚡ SPECIAL: Massive Rearmament (+2 Mil) / 軍備増強"
            elif "AID" in spec or "OIL" in spec:
                actor.mod_resource("econ", 3)
                return "⚡ SPECIAL: Economic Boom (+3 Econ) / 経済ブーム"
            elif "DIP" in spec or "BLOCK" in spec:
                actor.mod_resource("dip", 2)
                return "⚡ SPECIAL: Diplomatic Corps (+2 Dip) / 外交団派遣"
            else:
                # Default for others (Expand/Mobilize)
                actor.mod_resource("econ", 1)
                actor.mod_resource("pol", 1)
                return "⚡ SPECIAL: Mobilization (+1 Econ, +1 Pol) / 国家総動員"

        # 2. INTERNAL ACTIONS (with probability)
        if code.startswith("BUILD"):
            res, amt = action_def["cost"]
            gain_res, gain_amt = action_def["gain"]
            if actor.get_resource(res) < amt: return f"⚠️ Need {amt} {res.title()} / {res}が{amt}必要"
            actor.mod_resource(res, -amt)
            
            roll = random.randint(1, 10)
            # INDUSTRY & REARM: 70% full (4+), 30% partial (1-3)
            if code in ["BUILD_ECON", "BUILD_MIL"]:
                if roll >= 4:
                    actor.mod_resource(gain_res, gain_amt)
                    return f"🏭 SUCCESS! {gain_res.title()} +{gain_amt} / 大成功 (Roll {roll}/4)"
                else:
                    actor.mod_resource(gain_res, 1)
                    return f"⚠️ Partial... {gain_res.title()} +1 / 部分成功 (Roll {roll}/4)"
            # RALLY & DIPLOMACY: 60% full (5+), 40% partial (1-4)
            else:
                if roll >= 5:
                    actor.mod_resource(gain_res, gain_amt)
                    return f"🏭 SUCCESS! {gain_res.title()} +{gain_amt} / 大成功 (Roll {roll}/5)"
                else:
                    actor.mod_resource(gain_res, 1)
                    return f"⚠️ Partial... {gain_res.title()} +1 / 部分成功 (Roll {roll}/5)"

        # 3. TARGETED ACTIONS
        if not target: return "⚠️ Target Required / 対象国が必要"
        if actor == target: return "⚠️ Self-target Error / 自己対象不可"

        if code == "ACT_TRADE":
            if actor.dip < 1: return "⚠️ Need 1 Dip / Dipが1必要"
            actor.mod_resource("dip", -1)
            
            roll = random.randint(1, 10)
            if roll >= 4:  # 65% success (4-10 out of 10)
                if actor.ideology == target.ideology:
                    actor.mod_resource("econ", 1)
                    target.mod_resource("econ", 1)
                    return f"✅ Trade Signed (+1 Econ each) / 貿易成立 (互いに+1) (Roll {roll}/4)"
                else:
                    actor.mod_resource("econ", 1)
                    return f"⚖️ Unequal Treaty (+1 Econ You) / 不平等条約 (自国のみ+1) (Roll {roll}/4)"
            else:
                return f"❌ Trade Failed / 貿易失敗 (Roll {roll}/4)"

        elif code == "ACT_ALLIANCE":
            cost = 1
            difficulty = 5
            if actor.ideology != target.ideology:
                if target.ideology == Ideology.NEUTRAL: cost = 1; difficulty = 6
                else: cost = 2; difficulty = 8

            if actor.dip < cost: return f"⚠️ Need {cost} Dip / Dipが{cost}必要"
            if target.name_en in actor.allies: return "⚠️ Already Allied / 既に同盟関係"

            actor.mod_resource("dip", -cost)
            roll = random.randint(1, 10)
            if roll >= difficulty:
                actor.allies.add(target.name_en)
                target.allies.add(actor.name_en)
                actor.mod_resource("pol", 1)
                target.mod_resource("pol", 1)
                self.log_event(f"ALLIANCE: {actor.name_en} & {target.name_en}", f"同盟成立: {actor.name_ja} & {target.name_ja}")
                return f"✅ ALLIANCE! {target.name_en} accepts. / 同盟締結 (Roll {roll}/{difficulty})"
            else:
                if target.pol > 0: target.mod_resource("pol", -1)
                return f"❌ REJECTED! {target.name_en} refuses (-1 Pol). / 拒否 (Roll {roll}/{difficulty})"

        elif code == "ACT_BREAK":
            if target.name_en not in actor.allies: return "⚠️ Not Allied / 同盟していない"
            if actor.pol < 2: return "⚠️ Need 2 Pol / Polが2必要"
            actor.mod_resource("pol", -2)
            
            roll = random.randint(1, 10)
            actor.allies.discard(target.name_en)
            target.allies.discard(actor.name_en)
            self.log_event(f"BETRAYAL: {actor.name_en} broke with {target.name_en}", f"同盟破棄: {actor.name_ja} -> {target.name_ja}")
            
            if roll >= 4:  # 65% clean break (4-10)
                return f"💔 Alliance BROKEN (Clean) / 同盟破棄 (Roll {roll}/4)"
            elif roll >= 2:  # 25% additional penalty (2-3)
                actor.mod_resource("pol", -1)
                return f"💔 Alliance BROKEN (Scandal -1 Pol) / 同盟破棄 (スキャンダル) (Roll {roll}/4)"
            else:  # 10% strengthen target (1)
                target.mod_resource("pol", 1)
                return f"💔 Alliance BROKEN (Target +1 Pol) / 同盟破棄 (相手強化) (Roll {roll}/4)"

        elif code == "ACT_SPY":
            if actor.dip < 2: return "⚠️ Need 2 Dip / Dipが2必要"
            actor.mod_resource("dip", -2)
            target_res = random.choice(['econ', 'mil', 'pol', 'dip'])
            roll = random.randint(1, 10)
            if roll >= 7: 
                target.mod_resource(target_res, -1)
                return f"✅ Sabotage Success! -1 {target_res.title()} / 妨害成功 (Roll {roll}/7)"
            else:
                actor.mod_resource("pol", -1)
                return f"❌ Spy Caught! -1 Pol / スパイ発覚 (Roll {roll}/7)"

        elif code == "ACT_WAR":
            if actor.mil < 2: return "⚠️ Need 2 Mil / Milが2必要"
            if target.is_defeated: return f"⚠️ Target Occupied by {target.puppet_master} / 既に{target.puppet_master}の属国"
            
            actor.mod_resource("mil", -2)
            actor.mod_resource("pol", -1)
            atk = actor.mil + random.randint(1, 6) + (2 * len(actor.allies))
            defense = target.mil + random.randint(1, 6) + (2 * len(target.allies))
            
            if atk > defense:
                loot = min(3, target.econ)
                target.mod_resource("econ", -3)
                target.mod_resource("mil", -3)
                actor.mod_resource("econ", loot)
                actor.vp_total += 3
                
                # Track war damage and check for conquest
                target.war_damage += 1
                
                # Conquest if either resource hits 0
                if target.econ <= 0 or target.mil <= 0:
                    target.is_defeated = True
                    target.puppet_master = actor.name_en
                    target.conquered_round = self.current_round
                    actor.puppets_owned.add(target.name_en)
                    target.allies.clear()
                    
                    self.log_event(f"CONQUEST: {actor.name_en} conquered {target.name_en}", f"征服: {actor.name_ja}が{target.name_ja}を征服")
                    msg = f"👑 TOTAL VICTORY! Conquered / 完全勝利・征服"
                    
                    # Liberation Cascade (Recursive)
                    liberated = self.liberate_cascade(target, actor)
                    
                    if liberated:
                        actor.vp_total += (len(liberated) * 2)
                        lib_str = ', '.join(liberated)
                        msg += f" | 🕊️ LIBERATED: {lib_str} / 解放"
                        self.log_event(f"LIBERATION: {lib_str} freed", f"解放: {lib_str}")
                    return msg
                return f"⚔️ VICTORY! Looted {loot} Econ / 勝利・略奪 ({target.war_damage}/3 damage)"
            else:
                actor.mod_resource("mil", -2)
                target.vp_total += 2
                return "🛡️ DEFEAT! Repelled / 敗北・撃退"

        return "Error"

    def update_scores(self):
        for c in self.unique_countries:
            if c.is_defeated: 
                master = self.get_country(c.puppet_master)
                if master and c.econ > 1:
                    # Only extract if econ > 1 (leave minimum for stability)
                    c.mod_resource("econ", -1)
                    master.mod_resource("econ", 1)
                continue
            c.vp_total += 1
            if c.ideology == Ideology.FASCIST:
                if c.mil >= 10: c.vp_total += 2
                elif c.mil >= 9: c.vp_total += 1  # Partial bonus
                if len(c.allies) >= 3: c.vp_total += 1
            elif c.ideology == Ideology.LIBERAL:
                if c.econ >= 10: c.vp_total += 2
                elif c.econ >= 9: c.vp_total += 1  # Partial bonus
                if len(c.allies) >= 3: c.vp_total += 1
            elif c.ideology == Ideology.COMMUNIST:
                if c.pol >= 9: c.vp_total += 2
                elif c.pol >= 8: c.vp_total += 1  # Partial bonus
                if c.mil >= 8: c.vp_total += 1
            elif c.ideology == Ideology.NEUTRAL:
                if c.econ >= 8 and c.mil >= 5: c.vp_total += 2
                elif c.econ >= 7 or c.mil >= 4: c.vp_total += 1  # Partial bonus
                if c.dip >= 7: c.vp_total += 1