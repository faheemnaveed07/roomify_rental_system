---
title: Roomify Backend API
emoji: 🏠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Roomify Rental System — Backend API

Express + TypeScript + MongoDB API with Socket.IO real-time notifications,
role-based access control, and Cloudinary/S3 file uploads.

This Space is built from a `Dockerfile` (Docker SDK). Hugging Face exposes the
container on the port declared by `app_port` above (`7860`); the app reads
`process.env.PORT`.

## Configuration

All secrets are provided via the Space **Settings → Variables and secrets**
(never committed). See the deployment guide for the full list:
`MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`,
`CLOUDINARY_*`, `AWS_*`, `SMTP_*`.

## Health

`GET /api/health` returns a JSON heartbeat — used by the container healthcheck
and an external uptime pinger to keep the Space warm.
