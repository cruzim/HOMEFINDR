"""
Rate limiter instance — defined here (not in main.py) so that endpoint
modules can import it without creating a circular dependency.

    main.py  →  api_router  →  auth.py  →  limiter   ✓ (no cycle)
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])