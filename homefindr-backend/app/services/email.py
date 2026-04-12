"""
Email notification service using SendGrid.
Sends transactional emails for: offer updates, viewing confirmations,
new messages, price alerts, and account events.
"""
import httpx
from typing import Optional

from app.core.config import settings


SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"


async def _send(to_email: str, to_name: str, subject: str, html: str) -> bool:
    """Core async send via SendGrid REST API."""
    if not settings.SENDGRID_API_KEY:
        # No key configured — log and skip in development
        print(f"[EMAIL SKIP] To: {to_email} | Subject: {subject}")
        return True

    payload = {
        "personalizations": [{"to": [{"email": to_email, "name": to_name}]}],
        "from": {"email": settings.FROM_EMAIL, "name": settings.FROM_NAME},
        "subject": subject,
        "content": [{"type": "text/html", "value": html}],
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            SENDGRID_API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )
    return resp.status_code in (200, 202)


def _base_template(content: str) -> str:
    """Minimal branded HTML wrapper."""
    return f"""
    <html><body style="font-family:'DM Sans',sans-serif;background:#f9fafb;margin:0;padding:24px">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;
                  box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <div style="background:#2563eb;padding:20px 28px;display:flex;align-items:center;gap:10px">
          <span style="color:#fff;font-size:20px;font-weight:800">🏠 HomeFindr</span>
        </div>
        <div style="padding:28px 28px 20px">{content}</div>
        <div style="padding:16px 28px;background:#f3f4f6;font-size:12px;color:#9ca3af;text-align:center">
          © 2024 HomeFindr Inc. · Victoria Island, Lagos · <a href="#" style="color:#9ca3af">Unsubscribe</a>
        </div>
      </div>
    </body></html>
    """


# ── Specific email templates ───────────────────────────────────────────

async def send_welcome_email(to_email: str, name: str) -> bool:
    html = _base_template(f"""
        <h2 style="color:#111827;margin-bottom:8px">Welcome to HomeFindr, {name}! 🎉</h2>
        <p style="color:#6b7280;line-height:1.7">
          Nigeria's most trusted real estate marketplace is ready for you.
          Start browsing thousands of listings across Lagos, Abuja, Port Harcourt, and more.
        </p>
        <a href="{settings.FRONTEND_URL}/search"
           style="display:inline-block;margin-top:16px;padding:12px 24px;
                  background:#2563eb;color:#fff;border-radius:10px;
                  font-weight:700;text-decoration:none">Browse Properties →</a>
    """)
    return await _send(to_email, name, "Welcome to HomeFindr! 🏠", html)


async def send_offer_submitted_email(
    to_email: str,
    agent_name: str,
    buyer_name: str,
    property_address: str,
    offer_price: int,
    offer_id: str,
) -> bool:
    formatted_price = f"₦{offer_price:,}"
    html = _base_template(f"""
        <h2 style="color:#111827;margin-bottom:8px">New Offer Received</h2>
        <p style="color:#6b7280">Hi {agent_name}, you have received a new offer on one of your listings.</p>
        <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 6px;font-weight:700;color:#111827">📍 {property_address}</p>
          <p style="margin:0;font-size:22px;font-weight:800;color:#2563eb">{formatted_price}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#9ca3af">offered by {buyer_name}</p>
        </div>
        <a href="{settings.FRONTEND_URL}/offers?id={offer_id}"
           style="display:inline-block;margin-top:8px;padding:12px 24px;
                  background:#2563eb;color:#fff;border-radius:10px;
                  font-weight:700;text-decoration:none">Review Offer →</a>
    """)
    return await _send(to_email, agent_name, f"New offer on {property_address}", html)


async def send_offer_status_email(
    to_email: str,
    buyer_name: str,
    property_address: str,
    new_status: str,
    counter_price: Optional[int],
    offer_id: str,
) -> bool:
    status_colors = {
        "accepted": "#10b981", "rejected": "#ef4444",
        "countered": "#f97316", "reviewed": "#3b82f6",
    }
    color = status_colors.get(new_status.lower(), "#6b7280")
    counter_block = ""
    if counter_price:
        counter_block = f"""
        <p style="color:#6b7280;margin-top:8px">
          Counter offer: <strong style="color:#111827">₦{counter_price:,}</strong>
        </p>"""
    html = _base_template(f"""
        <h2 style="color:#111827;margin-bottom:8px">Offer Update</h2>
        <p style="color:#6b7280">Hi {buyer_name}, your offer on <strong>{property_address}</strong> has been updated.</p>
        <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin:16px 0">
          <span style="display:inline-block;background:{color};color:#fff;
                       padding:4px 12px;border-radius:99px;font-size:12px;
                       font-weight:700;text-transform:uppercase">{new_status}</span>
          {counter_block}
        </div>
        <a href="{settings.FRONTEND_URL}/offers?id={offer_id}"
           style="display:inline-block;margin-top:8px;padding:12px 24px;
                  background:#2563eb;color:#fff;border-radius:10px;
                  font-weight:700;text-decoration:none">View Offer →</a>
    """)
    return await _send(to_email, buyer_name, f"Your offer status: {new_status.upper()}", html)


async def send_viewing_confirmation_email(
    to_email: str,
    name: str,
    property_address: str,
    scheduled_at: str,
    agent_name: str,
    agent_phone: str,
    viewing_id: str,
) -> bool:
    html = _base_template(f"""
        <h2 style="color:#111827;margin-bottom:8px">Viewing Confirmed ✅</h2>
        <p style="color:#6b7280">Hi {name}, your property viewing has been scheduled.</p>
        <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 6px;font-weight:700;color:#111827">📍 {property_address}</p>
          <p style="margin:0 0 4px;color:#6b7280">📅 {scheduled_at}</p>
          <p style="margin:0;color:#6b7280">Agent: {agent_name} · {agent_phone}</p>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=HomeFindr+Viewing&details={property_address}"
             style="display:inline-block;padding:10px 18px;border:1px solid #e5e7eb;
                    border-radius:10px;font-size:13px;font-weight:600;color:#374151;
                    text-decoration:none">📅 Add to Google Calendar</a>
        </div>
    """)
    return await _send(to_email, name, f"Viewing confirmed: {property_address}", html)


async def send_new_message_email(
    to_email: str,
    recipient_name: str,
    sender_name: str,
    message_preview: str,
    conv_id: str,
) -> bool:
    preview = message_preview[:120] + ("..." if len(message_preview) > 120 else "")
    html = _base_template(f"""
        <h2 style="color:#111827;margin-bottom:8px">New Message from {sender_name}</h2>
        <div style="background:#f3f4f6;border-left:3px solid #2563eb;
                    border-radius:0 10px 10px 0;padding:14px 16px;margin:16px 0;
                    font-size:14px;color:#374151;line-height:1.6">
          {preview}
        </div>
        <a href="{settings.FRONTEND_URL}/messages?conv={conv_id}"
           style="display:inline-block;margin-top:8px;padding:12px 24px;
                  background:#2563eb;color:#fff;border-radius:10px;
                  font-weight:700;text-decoration:none">Reply →</a>
    """)
    return await _send(to_email, recipient_name, f"Message from {sender_name}", html)


async def send_price_drop_alert(
    to_email: str,
    name: str,
    property_address: str,
    old_price: int,
    new_price: int,
    property_id: str,
) -> bool:
    drop_pct = round((old_price - new_price) / old_price * 100, 1)
    html = _base_template(f"""
        <h2 style="color:#111827;margin-bottom:8px">Price Drop Alert 🔔</h2>
        <p style="color:#6b7280">Hi {name}, a property you saved just dropped in price.</p>
        <div style="background:#f3f4f6;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0 0 8px;font-weight:700;color:#111827">📍 {property_address}</p>
          <p style="margin:0;color:#9ca3af;text-decoration:line-through;font-size:13px">₦{old_price:,}</p>
          <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#10b981">
            ₦{new_price:,} <span style="font-size:13px">(-{drop_pct}%)</span>
          </p>
        </div>
        <a href="{settings.FRONTEND_URL}/listing/{property_id}"
           style="display:inline-block;margin-top:8px;padding:12px 24px;
                  background:#2563eb;color:#fff;border-radius:10px;
                  font-weight:700;text-decoration:none">View Property →</a>
    """)
    return await _send(to_email, name, f"Price drop on {property_address}", html)
