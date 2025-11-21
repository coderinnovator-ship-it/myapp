# ZETRA CORE — API CONTRACT (v1)

This document defines the exact request and response formats for the core Auth & Identity system.

---

## 1. AUTH — Request OTP

**POST /auth/request-otp**

### Request Body
{
  "phone": "+2348100000000"
}

### Response (Success)
{
  "success": true,
  "message": "OTP sent"
}

### Response (Error)
{
  "success": false,
  "error": "Invalid phone number"
}

---

## 2. AUTH — Verify OTP

**POST /auth/verify-otp**

### Request Body
{
  "phone": "+2348100000000",
  "otp": "123456"
}

### Response (Success)
{
  "success": true,
  "token": "JWT_TOKEN_HERE"
}

### Response (Error)
{
  "success": false,
  "error": "OTP incorrect or expired"
}

---

## 3. IDENTITY — Upload Selfie

**POST /identity/selfie**

- (Frontend will send image as form-data later)

### Response (Success)
{
  "success": true,
  "message": "Selfie uploaded"
}

---

## 4. IDENTITY — Verify BVN / NIN

**POST /identity/verify**

### Request Body
{
  "type": "bvn", 
  "value": "22334455667"
}

### Response (Success)
{
  "success": true,
  "match": true,
  "details": {
    "firstName": "John",
    "lastName": "Doe"
  }
}

---

## 5. USER — Get Profile

**GET /user/profile**

Headers:
Authorization: Bearer <JWT>

### Response
{
  "success": true,
  "user": {
    "id": "abc123",
    "phone": "+2348100000000",
    "verified": true
  }
}
