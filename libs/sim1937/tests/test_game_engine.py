import pytest
from sim1937.game_engine import GameEngine
from sim1937.country import Country

@pytest.fixture
def engine():
    return GameEngine()

def test_engine_initialization(engine):
    assert len(engine.unique_countries) == 14
    assert engine.current_round == 1

def test_get_country(engine):
    germany = engine.get_country("Germany")
    assert germany is not None
    assert germany.name_en == "Germany"
    
    japan = engine.get_country("日本")
    assert japan is not None
    assert japan.name_en == "Japan"
    
    none = engine.get_country("Atlantis")
    assert none is None

def test_process_turn_invalid_actor(engine):
    result = engine.process_turn("Atlantis", "INDUSTRY", "Germany")
    assert "Unknown Actor" in result

def test_process_turn_invalid_action(engine):
    result = engine.process_turn("Germany", "DANCE", "Germany")
    assert "Invalid Action" in result

def test_process_turn_self_target_error(engine):
    # TRADE requires target and cannot be self
    result = engine.process_turn("Germany", "TRADE", "Germany")
    assert "Self-target Error" in result

def test_process_turn_target_required(engine):
    # TRADE requires target
    result = engine.process_turn("Germany", "TRADE", "")
    assert "Target Required" in result

def test_build_action_success(engine):
    # Germany starts with Dip 4. INDUSTRY costs 2 Dip.
    germany = engine.get_country("Germany")
    initial_dip = germany.dip
    initial_econ = germany.econ
    
    # Mock random to ensure success (roll >= 4)
    # Since we can't easily mock random inside the class without patching,
    # we can just check that resources changed correctly in one direction or another.
    # Or we can patch random.randint
    
    import random
    original_randint = random.randint
    random.randint = lambda a, b: 10 # Always success
    
    try:
        result = engine.process_turn("Germany", "INDUSTRY", "")
        assert "SUCCESS" in result
        assert germany.dip == initial_dip - 2
        assert germany.econ == initial_econ + 2
    finally:
        random.randint = original_randint

def test_special_action(engine):
    germany = engine.get_country("Germany")
    assert not germany.special_used
    
    result = engine.process_turn("Germany", "SPECIAL", "")
    assert "SPECIAL" in result
    assert germany.special_used
    
    # Second time should fail
    result = engine.process_turn("Germany", "SPECIAL", "")
    assert "already used" in result
