"""
Payment endpoints using Stripe.
POST /payments/create-intent  — create a PaymentIntent for earnest deposit
POST /payments/webhook        — Stripe webhook handler
GET  /payments/me             — buyer's payment history
"""
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.config import settings
from app.db.session import get_db
from app.models.models import Offer, Payment, PaymentStatus, UserRole
from app.schemas.schemas import MessageResponse, PaymentCreate, PaymentIntentOut, PaymentOut
from app.api.v1.deps import CurrentUser

stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/create-intent", response_model=PaymentIntentOut, status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    body: PaymentCreate,
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> PaymentIntentOut:
    """
    Create a Stripe PaymentIntent for an earnest money deposit.
    Returns a client_secret the frontend uses to confirm payment.
    """
    if current_user.role not in (UserRole.buyer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Only buyers can make payments")

    # Validate the offer exists and belongs to this buyer
    offer_result = await db.execute(select(Offer).where(Offer.id == body.offer_id))
    offer: Offer | None = offer_result.scalar_one_or_none()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your offer")

    # Create Stripe PaymentIntent (amount in kobo = Naira * 100)
    try:
        intent = stripe.PaymentIntent.create(
            amount=body.amount * 100,   # Stripe uses smallest currency unit
            currency=settings.STRIPE_CURRENCY,
            metadata={
                "offer_id": body.offer_id,
                "user_id": current_user.id,
                "property_id": offer.property_id,
            },
            description=body.description,
            automatic_payment_methods={"enabled": True},
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {e.user_message}")

    # Persist payment record
    payment = Payment(
        offer_id=body.offer_id,
        user_id=current_user.id,
        amount=body.amount,
        description=body.description,
        status=PaymentStatus.pending,
        stripe_payment_intent_id=intent.id,
        stripe_client_secret=intent.client_secret,
    )
    db.add(payment)
    await db.flush()

    return PaymentIntentOut(
        payment_id=payment.id,
        client_secret=intent.client_secret,
        amount=body.amount,
        currency=settings.STRIPE_CURRENCY,
        status=PaymentStatus.pending,
    )


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    """
    Stripe sends events here when payment status changes.
    Verify the webhook signature before processing.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    intent_id = event["data"]["object"].get("id")
    if not intent_id:
        return {"received": True}

    result = await db.execute(
        select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
    )
    payment: Payment | None = result.scalar_one_or_none()
    if not payment:
        return {"received": True}

    event_type = event["type"]
    if event_type == "payment_intent.succeeded":
        payment.status = PaymentStatus.succeeded
    elif event_type == "payment_intent.payment_failed":
        payment.status = PaymentStatus.failed
    elif event_type == "payment_intent.canceled":
        payment.status = PaymentStatus.failed
    elif event_type == "charge.refunded":
        payment.status = PaymentStatus.refunded

    return {"received": True}


@router.get("/me", response_model=List[PaymentOut])
async def my_payments(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> list:
    """Return the current user's payment history."""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == current_user.id)
        .order_by(Payment.created_at.desc())
    )
    return result.scalars().all()
