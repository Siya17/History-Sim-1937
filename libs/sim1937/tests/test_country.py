import pytest
from sim1937.country import Country
from sim1937.game_types import Ideology
from sim1937.config import Config

@pytest.fixture
def country():
    return Country(
        name_en="TestLand",
        name_ja="テストランド",
        ideology=Ideology.NEUTRAL,
        econ=5,
        mil=5,
        pol=5,
        dip=5,
        special_code="TEST_SPEC"
    )

def test_initialization(country):
    assert country.name_en == "TestLand"
    assert country.econ == 5
    assert country.special_code == "TEST_SPEC"
    assert not country.is_defeated

def test_mod_resource_gain(country):
    overflow = country.mod_resource("econ", 5)
    assert country.econ == 10
    assert overflow == 0

def test_mod_resource_cap(country):
    # Cap is 15 defined in Config
    overflow = country.mod_resource("econ", 20)
    assert country.econ == Config.RESOURCE_CAP
    assert overflow == 10 # 5 + 20 = 25, cap 15, overflow 10

def test_mod_resource_loss(country):
    country.mod_resource("mil", -2)
    assert country.mil == 3

def test_mod_resource_min_zero(country):
    country.mod_resource("pol", -10)
    assert country.pol == 0

def test_defeated_resource_lock(country):
    country.is_defeated = True
    country.mod_resource("econ", 5)
    assert country.econ == 5 # Should not change if defeated and positive amount
    
    country.mod_resource("econ", -2)
    assert country.econ == 3 # Can still lose resources? Logic says: if self.is_defeated and amount > 0: return 0
