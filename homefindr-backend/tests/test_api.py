"""
Test suite for HomeFindr backend.
Uses pytest-asyncio + httpx AsyncClient against the FastAPI app.

Run with:  pytest tests/ -v --asyncio-mode=auto
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.main import app
from app.db.session import Base, get_db
from app.core.security import hash_password

# ── In-memory SQLite for tests ────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    """Create and drop all tables for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


# ── Helper fixtures ───────────────────────────────────────────────────

@pytest_asyncio.fixture
async def buyer_token(client: AsyncClient) -> str:
    """Register a buyer and return their access token."""
    await client.post("/api/v1/auth/register", json={
        "full_name": "Test Buyer",
        "email": "buyer@test.ng",
        "password": "SecurePass1",
        "role": "buyer",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "buyer@test.ng",
        "password": "SecurePass1",
    })
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def agent_token(client: AsyncClient) -> str:
    """Register an agent and return their access token."""
    await client.post("/api/v1/auth/register", json={
        "full_name": "Test Agent",
        "email": "agent@test.ng",
        "password": "SecurePass1",
        "role": "agent",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "email": "agent@test.ng",
        "password": "SecurePass1",
    })
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def sample_property(client: AsyncClient, agent_token: str) -> dict:
    """Create a sample property as an agent."""
    resp = await client.post(
        "/api/v1/properties",
        json={
            "title": "4 Bedroom Duplex in Ikoyi",
            "address": "14B Bourdillon Road",
            "area": "Ikoyi",
            "city": "Lagos",
            "state": "Lagos",
            "price": 750_000_000,
            "property_type": "Detached Duplex",
            "beds": 4,
            "baths": 5.0,
            "sqft": 4200,
        },
        headers={"Authorization": f"Bearer {agent_token}"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ═══════════════════════════════════════════════════════════════════════
# AUTH TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestAuth:
    async def test_register_buyer(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "full_name": "Chidi Okeke",
            "email": "chidi@test.ng",
            "password": "MyPass123",
            "role": "buyer",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "chidi@test.ng"
        assert data["role"] == "buyer"
        assert "hashed_password" not in data

    async def test_register_duplicate_email_fails(self, client: AsyncClient):
        payload = {"full_name": "A", "email": "dup@test.ng", "password": "Pass1234", "role": "buyer"}
        await client.post("/api/v1/auth/register", json=payload)
        resp = await client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 409

    async def test_login_success(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "full_name": "Ngozi",
            "email": "ngozi@test.ng",
            "password": "Pass1234",
            "role": "buyer",
        })
        resp = await client.post("/api/v1/auth/login", json={
            "email": "ngozi@test.ng",
            "password": "Pass1234",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, client: AsyncClient, buyer_token: str):
        resp = await client.post("/api/v1/auth/login", json={
            "email": "buyer@test.ng",
            "password": "WrongPass999",
        })
        assert resp.status_code == 401

    async def test_refresh_tokens(self, client: AsyncClient):
        await client.post("/api/v1/auth/register", json={
            "full_name": "Refresh User",
            "email": "refresh@test.ng",
            "password": "Pass1234",
            "role": "buyer",
        })
        login_resp = await client.post("/api/v1/auth/login", json={
            "email": "refresh@test.ng",
            "password": "Pass1234",
        })
        refresh_token = login_resp.json()["refresh_token"]
        resp = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    async def test_get_me(self, client: AsyncClient, buyer_token: str):
        resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert resp.json()["email"] == "buyer@test.ng"

    async def test_unauthenticated_me_fails(self, client: AsyncClient):
        resp = await client.get("/api/v1/auth/me")
        assert resp.status_code == 401

    async def test_weak_password_rejected(self, client: AsyncClient):
        resp = await client.post("/api/v1/auth/register", json={
            "full_name": "Weak",
            "email": "weak@test.ng",
            "password": "nodigits",
            "role": "buyer",
        })
        assert resp.status_code == 422


# ═══════════════════════════════════════════════════════════════════════
# PROPERTY TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestProperties:
    async def test_list_properties_public(self, client: AsyncClient):
        resp = await client.get("/api/v1/properties")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data

    async def test_create_property_as_agent(self, client: AsyncClient, sample_property: dict):
        assert sample_property["address"] == "14B Bourdillon Road"
        assert sample_property["price"] == 750_000_000
        assert sample_property["status"] == "draft"

    async def test_buyer_cannot_create_property(self, client: AsyncClient, buyer_token: str):
        resp = await client.post(
            "/api/v1/properties",
            json={
                "title": "Test",
                "address": "1 Test St",
                "area": "VI",
                "city": "Lagos",
                "state": "Lagos",
                "price": 50_000_000,
                "property_type": "Flat/Apartment",
                "beds": 2,
                "baths": 2.0,
                "sqft": 1000,
            },
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 403

    async def test_get_property_by_id(self, client: AsyncClient, sample_property: dict):
        prop_id = sample_property["id"]
        resp = await client.get(f"/api/v1/properties/{prop_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == prop_id

    async def test_get_nonexistent_property(self, client: AsyncClient):
        resp = await client.get("/api/v1/properties/nonexistent-id")
        assert resp.status_code == 404

    async def test_update_property(self, client: AsyncClient, agent_token: str, sample_property: dict):
        prop_id = sample_property["id"]
        resp = await client.patch(
            f"/api/v1/properties/{prop_id}",
            json={"price": 700_000_000},
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["price"] == 700_000_000
        assert data["original_price"] == 750_000_000

    async def test_save_and_unsave_property(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        prop_id = sample_property["id"]
        # Save
        resp = await client.post(
            f"/api/v1/properties/{prop_id}/save",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert "Saved" in resp.json()["message"]
        # Unsave (toggle)
        resp2 = await client.post(
            f"/api/v1/properties/{prop_id}/save",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert "Removed" in resp2.json()["message"]

    async def test_search_properties(self, client: AsyncClient, sample_property: dict):
        resp = await client.get("/api/v1/properties/search?q=Bourdillon")
        assert resp.status_code == 200

    async def test_filter_by_city(self, client: AsyncClient, sample_property: dict):
        resp = await client.get("/api/v1/properties?city=Lagos")
        assert resp.status_code == 200

    async def test_delete_property(self, client: AsyncClient, agent_token: str, sample_property: dict):
        prop_id = sample_property["id"]
        resp = await client.delete(
            f"/api/v1/properties/{prop_id}",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert resp.status_code == 200
        # Confirm gone
        check = await client.get(f"/api/v1/properties/{prop_id}")
        assert check.status_code == 404


# ═══════════════════════════════════════════════════════════════════════
# OFFER TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestOffers:
    async def test_submit_offer(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        prop_id = sample_property["id"]
        resp = await client.post(
            "/api/v1/offers",
            json={
                "property_id": prop_id,
                "offer_price": 720_000_000,
                "down_payment_pct": 20.0,
                "contingencies": ["Home Inspection", "Appraisal"],
            },
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["offer_price"] == 720_000_000
        assert data["status"] == "sent"

    async def test_agent_cannot_submit_offer(self, client: AsyncClient, agent_token: str, sample_property: dict):
        resp = await client.post(
            "/api/v1/offers",
            json={"property_id": sample_property["id"], "offer_price": 700_000_000},
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        assert resp.status_code == 403

    async def test_duplicate_offer_rejected(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        prop_id = sample_property["id"]
        payload = {"property_id": prop_id, "offer_price": 700_000_000}
        headers = {"Authorization": f"Bearer {buyer_token}"}
        await client.post("/api/v1/offers", json=payload, headers=headers)
        resp = await client.post("/api/v1/offers", json=payload, headers=headers)
        assert resp.status_code == 409

    async def test_list_my_offers(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        await client.post(
            "/api/v1/offers",
            json={"property_id": sample_property["id"], "offer_price": 700_000_000},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        resp = await client.get(
            "/api/v1/offers/me",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    async def test_withdraw_offer(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        create_resp = await client.post(
            "/api/v1/offers",
            json={"property_id": sample_property["id"], "offer_price": 700_000_000},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        offer_id = create_resp.json()["id"]
        resp = await client.delete(
            f"/api/v1/offers/{offer_id}",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# VIEWING TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestViewings:
    async def test_schedule_viewing(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        resp = await client.post(
            "/api/v1/viewings",
            json={
                "property_id": sample_property["id"],
                "scheduled_at": "2024-02-01T11:00:00Z",
                "contact_name": "Test Buyer",
                "contact_phone": "+2348000000001",
            },
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["status"] == "scheduled"

    async def test_list_my_viewings(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        await client.post(
            "/api/v1/viewings",
            json={"property_id": sample_property["id"], "scheduled_at": "2024-02-05T10:00:00Z"},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        resp = await client.get(
            "/api/v1/viewings/me",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_cancel_viewing(self, client: AsyncClient, buyer_token: str, sample_property: dict):
        create_resp = await client.post(
            "/api/v1/viewings",
            json={"property_id": sample_property["id"], "scheduled_at": "2024-02-10T14:00:00Z"},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        viewing_id = create_resp.json()["id"]
        resp = await client.delete(
            f"/api/v1/viewings/{viewing_id}",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# MESSAGING TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestMessages:
    async def test_start_conversation(self, client: AsyncClient, buyer_token: str, agent_token: str):
        # Get agent ID first
        agent_resp = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {agent_token}"},
        )
        agent_id = agent_resp.json()["id"]

        resp = await client.post(
            "/api/v1/messages/conversations",
            json={
                "agent_id": agent_id,
                "first_message": "Hi, I am interested in your listing.",
            },
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 201
        assert len(resp.json()["messages"]) == 1

    async def test_list_conversations(self, client: AsyncClient, buyer_token: str, agent_token: str):
        agent_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {agent_token}"})
        agent_id = agent_resp.json()["id"]
        await client.post(
            "/api/v1/messages/conversations",
            json={"agent_id": agent_id, "first_message": "Hello!"},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        resp = await client.get(
            "/api/v1/messages/conversations",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_send_message_in_conversation(self, client: AsyncClient, buyer_token: str, agent_token: str):
        agent_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {agent_token}"})
        agent_id = agent_resp.json()["id"]
        conv_resp = await client.post(
            "/api/v1/messages/conversations",
            json={"agent_id": agent_id, "first_message": "Hello!"},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        conv_id = conv_resp.json()["id"]
        resp = await client.post(
            f"/api/v1/messages/conversations/{conv_id}/messages",
            json={"content": "Is the property still available?"},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["content"] == "Is the property still available?"

    async def test_unread_count(self, client: AsyncClient, buyer_token: str):
        resp = await client.get(
            "/api/v1/messages/unread-count",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert "unread" in resp.json()


# ═══════════════════════════════════════════════════════════════════════
# SAVED SEARCH TESTS
# ═══════════════════════════════════════════════════════════════════════

class TestSavedSearches:
    async def test_create_saved_search(self, client: AsyncClient, buyer_token: str):
        resp = await client.post(
            "/api/v1/users/me/saved-searches",
            json={
                "name": "Lagos 4BR under ₦500M",
                "filters": {"city": "Lagos", "beds": 4, "max_price": 500_000_000},
            },
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 201
        assert resp.json()["name"] == "Lagos 4BR under ₦500M"

    async def test_list_saved_searches(self, client: AsyncClient, buyer_token: str):
        await client.post(
            "/api/v1/users/me/saved-searches",
            json={"name": "My Search", "filters": {}},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        resp = await client.get(
            "/api/v1/users/me/saved-searches",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    async def test_delete_saved_search(self, client: AsyncClient, buyer_token: str):
        create_resp = await client.post(
            "/api/v1/users/me/saved-searches",
            json={"name": "To Delete", "filters": {}},
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        search_id = create_resp.json()["id"]
        resp = await client.delete(
            f"/api/v1/users/me/saved-searches/{search_id}",
            headers={"Authorization": f"Bearer {buyer_token}"},
        )
        assert resp.status_code == 200


# ═══════════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════

class TestHealth:
    async def test_health_endpoint(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"

    async def test_root_endpoint(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.status_code == 200
        assert "HomeFindr" in resp.json()["name"]
