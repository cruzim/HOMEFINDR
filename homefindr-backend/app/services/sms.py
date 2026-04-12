"""
SMS notification service using Termii — Nigeria's leading SMS gateway.
Used for: viewing reminders, OTP verification, offer alerts.
"""
import httpx
from app.core.config import settings

TERMII_BASE_URL = "https://api.ng.termii.com/api"


async def send_sms(to_phone: str, message: str) -> bool:
    """
    Send a plain SMS via Termii.
    to_phone should be in international format: +2348012345678
    """
    if not settings.TERMII_API_KEY:
        print(f"[SMS SKIP] To: {to_phone} | {message[:60]}")
        return True

    # Normalize phone — Termii expects no leading +
    phone = to_phone.lstrip("+")

    payload = {
        "to": phone,
        "from": settings.TERMII_SENDER_ID,
        "sms": message,
        "type": "plain",
        "channel": "generic",
        "api_key": settings.TERMII_API_KEY,
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{TERMII_BASE_URL}/sms/send",
            json=payload,
            timeout=10.0,
        )
    return resp.status_code == 200


async def send_viewing_reminder_sms(name: str, phone: str, property_address: str, time_str: str) -> bool:
    message = (
        f"Hi {name.split()[0]}, reminder: your HomeFindr viewing of "
        f"{property_address} is at {time_str}. "
        f"Questions? Visit homefindr.ng"
    )
    return await send_sms(phone, message)


async def send_offer_alert_sms(name: str, phone: str, property_address: str, status: str) -> bool:
    message = (
        f"Hi {name.split()[0]}, your offer on {property_address} "
        f"has been {status}. Log in to HomeFindr for details."
    )
    return await send_sms(phone, message)


async def send_otp_sms(phone: str, otp: str) -> bool:
    message = f"Your HomeFindr verification code is {otp}. Valid for 10 minutes. Do not share."
    return await send_sms(phone, message)


async def send_new_message_sms(name: str, phone: str, sender_name: str) -> bool:
    message = (
        f"Hi {name.split()[0]}, you have a new message from {sender_name} on HomeFindr. "
        f"Reply at homefindr.ng/messages"
    )
    return await send_sms(phone, message)
