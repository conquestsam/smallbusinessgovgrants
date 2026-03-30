# Enterprise Platform Features - Admin Guide

This document explains the advanced platform-level features implemented for the SmallBusiness platform, including user lifecycle controls, payment gateway modularity, and automated follow-ups.

## 1. User Account Control

### Status Levels
- **Active**: Normal operations.
- **Disabled**: Temporary suspension. User cannot login or access APIs.
- **Deactivated**: Permanent suspension. Account marked as inactive.
- **Soft Deleted**: Hidden from platform but restorable in database.
- **Blacklisted**: Complete block at middleware level (Silent 404 behavior).

### How to use:
Navigate to **Admin > User Management**. Use the action menu (three dots) on any user to trigger the desired lifecycle action. A reason must be provided for audit purposes.

---

## 2. Global Blacklist (Anti-Fraud)

The platform supports blacklisting at four levels:
- **IP Address**: Blocks all traffic from a specific IP.
- **Email Address**: Blocks specific user emails.
- **Email Domain**: Blocks entire providers (e.g., mailinator.com).
- **User ID**: Specific persistent block for a user.

### Silent 404 Behavior:
Blacklisted entities will receive a standard **HTTP 404 Not Found** response instead of a 403 Forbidden. This is a security feature to prevent attackers from confirming the platform's response to their presence.

---

## 3. Payment Gateway Architecture

### Providers Supported:
- **Stripe**: Automated credit card processing with webhook verification.
- **Crypto**: Admin-configurable tokens (BTC, ETH, USDT, SOL). Supports user-uploaded transaction references.
- **Manual**: CashApp, Venmo, PayPal. Instructions-driven with manual verification.

### Configuration:
Navigate to **Admin > Settings > Payments**. You can toggle specific gateways, update wallet addresses, and set display priority for the frontend.

---

## 4. Contact Methods

Admins can dynamically configure the support channels shown to users.
- **Supported**: WhatsApp, Telegram, Signal, Email, Custom.
- **Features**: Pre-filled messages, priority sorting, and enable/disable toggles.

---

## 5. Automated Email Follow-ups

A robust database-backed queue system handles delayed email sequences.
- **Triggers**: Registration, Payment, Inactivity, etc.
- **Templates**: Fully customizable HTML templates with delay intervals.
- **Reliability**: Automatic retries (up to 3 times) and duplicate prevention.

---

## 6. Audit Logging

Every administrative action is logged in the `admin_actions_log` table, including:
- Admin ID
- Action Type
- Target ID
- Metadata (Reasons, old/new values)

This ensures complete accountability for platform changes.
