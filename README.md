# VidyarthiLekha Authentication Service

This service provides secure authentication & tenant platform features.

## ✔️ Features
- Tenant Login
- Forgot Password (Email)
- Reset Password
- Mobile OTP Verification
- Password Reset via OTP
- Super Admin OTP Login
- Platform Tenant Creation
- JWT Based Auth
- Swagger API Docs
- Winston Logging (with filename)
- SMS Service Integration
- Email Service Integration

---

## 🚀 Tech Stack
- Node.js / Express
- PostgreSQL
- JWT
- Swagger UI
- Winston Logger
- SMS (Twilio / Any Provider)
- Email (Nodemailer / SES / Gmail SMTP)

---

## 📦 Installation
```sh
npm install

⚙️ Environment Setup

Create .env in project root

PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
JWT_SECRET=your_jwt_secret

# Optional Email
EMAIL_USER=
EMAIL_PASS=

# Optional SMS (Example Twilio)
TWILIO_SID=
TWILIO_TOKEN=
TWILIO_FROM=

npm start

Swagger runs at:
http://localhost:3000/api-docs


