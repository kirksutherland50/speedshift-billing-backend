# SpeedShift Billing Backend

Production billing backend for SpeedShift.

## Purpose

This service is the backend source of truth for Google Play purchase verification and entitlement state.

Current Chat 1 scope includes:

- Express + TypeScript Cloud Run service
- Firestore persistence
- Google Play Developer API client
- `POST /play/purchase/verify`
- Idempotent verification flow
- Purchase normalization
- Entitlement computation
- Users / purchases / entitlements / events persistence

## Tech stack

- Node.js
- TypeScript
- Express
- Google Cloud Run
- Firestore
- Google Play Developer API

## Local development

### Requirements

- Node.js 20+
- Google Cloud CLI
- Local ADC configured
- Access to GCP project `speedshift-493423`

### Install

```powershell
npm install