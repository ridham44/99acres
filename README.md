# 99acres Backend API README

Backend API for a 99acres-style property listing app. This README is written for frontend and Postman testing: it explains what each API does, which APIs need auth, and what body/query data to send.

## Base URL

Local server:

```txt
http://localhost:5000/api
```

Run locally:

```bash
npm install
npm run dev
```

Production/start command:

```bash
npm start
```

## Database Cleanup - Deleted Users

If you have users that were deleted from the database **before** the cascading delete middleware was implemented, their orphaned data is still in the database. Use the cleanup scripts to remove it.

**These scripts work for ALL user types:** user, broker, channel_partner, builder, admin - regardless of role, all deleted user data is cleaned up.

### Step 1: Diagnose Database (Optional)

First, see what's in your database without removing anything:

```bash
node diagnose-db.js
```

This will show you:
- ✓ Total users in database (all types)
- ✓ Soft-deleted users (marked with `deletedAt`)
- ✓ Orphaned records (data from users who no longer exist)
- ✓ Which cleanup script to run

**Example Output:**
```
========== DATABASE DIAGNOSTIC REPORT ==========

1. SOFT-DELETED USERS (deletedAt is not null):
   Found 2 soft-deleted users:
   - John Doe - broker (john@example.com) - Deleted: 2026-05-20T10:00:00.000Z
   - Jane Smith - channel_partner (jane@example.com) - Deleted: 2026-05-21T14:30:00.000Z

2. ALL USERS IN DATABASE:
   Total users: 50

3. ORPHANED DATA (records with deleted user references):
   - Shortlists: 12 orphaned records
   - Reviews: 5 orphaned records
   - Properties: 8 orphaned records
   - Property Documents: 15 orphaned records

   TOTAL ORPHANED RECORDS: 40

========== SUMMARY ==========
Total Users: 50
Soft-Deleted Users: 2
Orphaned Records: 40

→ Run: node cleanup-deleted-users.js
→ Run: node cleanup-orphaned-data.js
```

### Step 2: Run Cleanup Script

Choose the appropriate cleanup script:

**For soft-deleted users** (users with `deletedAt` field - any role):
```bash
node cleanup-deleted-users.js
```

**For hard-deleted users** (users completely removed, leaving orphaned data - any role):
```bash
node cleanup-orphaned-data.js
```

**What it does:**
- Finds records with deleted user references (works for all user types/roles)
- Removes all their associated data:
  - Shortlists
  - Property visits
  - OTPs
  - Reviews
  - Requirements
  - Support tickets
  - User subscriptions
  - Login logs
  - Agent profiles (for brokers/channel_partners)
  - Properties (owned/managed by any user type)
  - Property documents
- Displays a detailed summary of what was cleaned

**Example Output:**
```
Starting cleanup of orphaned user data...

Found 50 active users in database

Checking for orphaned records...

  Found 12 orphaned Shortlists
  ✓ Deleted 12 records

  Found 5 orphaned Reviews
  ✓ Deleted 5 records

  Found 8 orphaned Properties
  ✓ Deleted 8 property documents
  ✓ Deleted 8 properties

========== CLEANUP SUMMARY ==========
Total orphaned records removed: 40

Breakdown by type:
  - Shortlists: 12
  - Reviews: 5
  - Properties: 8
  - Property Documents: 15

✓ All orphaned data has been successfully removed!
========== CLEANUP COMPLETE ==========
```

**Note:** Going forward, all new user deletions (regardless of role) will automatically cascade-delete associated data via MongoDB middleware, so you won't need to run these scripts again unless you delete more users directly from the database.

## Common Response Format

Most successful APIs return:

```json
{
  "success": true,
  "message": "Something successful",
  "data": {}
}
```

Most errors return:

```json
{
  "success": false,
  "message": "Error message"
}
```

List APIs may also return `pagination`:

```json
{
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

## Auth In Postman

Protected endpoints require a login token.

Use this header:

```txt
Authorization: Bearer {{token}}
```

If you verify OTP with `deviceId`, also send this header on every protected request:

```txt
x-device-id: {{deviceId}}
```

Important: this backend also validates the active login session and IP address from the login request. If Postman starts returning `Unauthorized: IP address mismatch` or `Session expired`, log in again.

## Suggested Postman Variables

Create an environment with:

```txt
baseUrl = http://localhost:5000/api
token =
deviceId = postman-web-001
userId =
propertyId =
requirementId = 
amenityId =
furnitureId =
nearbyPlaceId =
positiveKeywordId =
negativeKeywordId =
reviewId =
documentId =
privacyPolicyId =
termsConditionsId =
faqId =
expertInAreaId =
```

## Auth APIs

### Register User

Creates a user if the phone does not already exist, then sends OTP. In this development code, OTP is also returned in the response.

`POST {{baseUrl}}/auth/register`

Body type: `json` or `form-data`.

Use `form-data` when uploading a profile image:

```txt
name = Rahul Sharma
phone = 9876543210
role = user
email = rahul@example.com
city = Ahmedabad
state = Gujarat
profileImage = select jpg/jpeg/png/webp file
documents = select pdf/image/doc/docx file
documents = select another document file
```

JSON body without image:

```json
{
  "name": "Rahul Sharma",
  "phone": "9876543210",
  "role": "user",
  "email": "rahul@example.com",
  "city": "Ahmedabad",
  "state": "Gujarat",
  "documents": []
}
```

Broker/channel_partner/builder must include `agencyName`:

```json
{
  "name": "Amit Broker",
  "phone": "9876543211",
  "role": "broker",
  "agencyName": "Prime Realty",
  "email": "amit@example.com",
  "city": "Ahmedabad",
  "state": "Gujarat"
}
```

Allowed roles: `user`, `broker`, `channel_partner`, `builder`, `admin`.

### Verify Register OTP

Verifies registration OTP and returns JWT token.

`POST {{baseUrl}}/auth/verify-register-otp`

Body:

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceId": "{{deviceId}}",
  "deviceType": "web"
}
```

Postman test script:

```js
const json = pm.response.json();
if (json.token) {
  pm.environment.set("token", json.token);
  pm.environment.set("userId", json.data.id);
}
```

### Login

Sends login OTP for an existing user.

`POST {{baseUrl}}/auth/login`

Body:

```json
{
  "phone": "9876543210"
}
```

### Verify Login OTP

Verifies login OTP and returns JWT token.

`POST {{baseUrl}}/auth/verify-login-otp`

Body:

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceId": "{{deviceId}}",
  "deviceType": "web"
}
```

Postman test script:

```js
const json = pm.response.json();
if (json.token) {
  pm.environment.set("token", json.token);
  pm.environment.set("userId", json.data.id);
}
```

### Resend OTP

`POST {{baseUrl}}/auth/resend-otp`

Body:

```json
{
  "phone": "9876543210",
  "type": "login"
}
```

Allowed `type`: `register`, `login`.

### Logout

Marks current login session as logged out.

`POST {{baseUrl}}/auth/logout`

Headers: auth required.

### Login Logs

Returns login session logs.

`GET {{baseUrl}}/auth/log-login?page=1&limit=10&isLogin=true&deviceType=web&search=Chrome`

Headers: auth required. Admin access only.

Optional query params: `page`, `limit`, `isAdmin`, `isLogin`, `userId`, `deviceType`, `search`.

### Admin Login

Sends login OTP for an existing user with the `admin` role. If the user does not exist or does not have the admin role, returns an error.

`POST {{baseUrl}}/auth/admin/login`

Body:

```json
{
  "phone": "9876543210"
}
```

### Verify Admin Login OTP

Verifies admin login OTP and returns JWT token with admin privileges.

`POST {{baseUrl}}/auth/admin/verify-login-otp`

Body:

```json
{
  "phone": "9876543210",
  "otp": "123456",
  "deviceId": "{{deviceId}}",
  "deviceType": "web"
}
```

Postman test script:

```js
const json = pm.response.json();
if (json.token) {
  pm.environment.set("token", json.token);
  pm.environment.set("userId", json.data.id);
}
```

## Admin APIs

These routes are for admin users only. All admin APIs require:

```txt
Authorization: Bearer {{token}}
```

and a logged-in user with the `admin` role.

### Get All Users

Returns every user in the system.

`GET {{baseUrl}}/auth/getAllUsers`

Headers: auth required, admin only.

### Login Logs

Returns login session logs. Admins can filter and paginate.

`GET {{baseUrl}}/auth/log-login?page=1&limit=10&isLogin=true&deviceType=web&search=Chrome`

Headers: auth required, admin only.

Optional query params: `page`, `limit`, `isAdmin`, `isLogin`, `userId`, `deviceType`, `search`.

### Support FAQ Admin CRUD

Admin routes for managing FAQ content.

- `GET {{baseUrl}}/support/admin/faqs`
- `POST {{baseUrl}}/support/admin/faqs`
- `PATCH {{baseUrl}}/support/admin/faqs/:id`
- `DELETE {{baseUrl}}/support/admin/faqs/:id`

### Support Ticket Admin Management

Admin routes for managing support tickets.

- `GET {{baseUrl}}/support/admin/tickets`
- `GET {{baseUrl}}/support/admin/tickets/:id`
- `PATCH {{baseUrl}}/support/admin/tickets/:id`
- `DELETE {{baseUrl}}/support/admin/tickets/:id`

### Privacy Policy Admin CRUD

- `POST {{baseUrl}}/privacy-policy/admin`
- `GET {{baseUrl}}/privacy-policy/admin`
- `GET {{baseUrl}}/privacy-policy/admin/:id`
- `PUT {{baseUrl}}/privacy-policy/admin/:id`
- `DELETE {{baseUrl}}/privacy-policy/admin/:id`

### Terms & Conditions Admin CRUD

- `POST {{baseUrl}}/terms-conditions/admin`
- `GET {{baseUrl}}/terms-conditions/admin`
- `GET {{baseUrl}}/terms-conditions/admin/:id`
- `PUT {{baseUrl}}/terms-conditions/admin/:id`
- `DELETE {{baseUrl}}/terms-conditions/admin/:id`

### Subscription Plan Admin CRUD

- `POST {{baseUrl}}/subscription-plans`
- `GET {{baseUrl}}/subscription-plans`
- `GET {{baseUrl}}/subscription-plans/:id`
- `PUT {{baseUrl}}/subscription-plans/:id`
- `DELETE {{baseUrl}}/subscription-plans/:id`

> Notes:
> - Admin API paths under `privacy-policy`, `terms-conditions`, and `subscription-plans` already enforce admin access.
> - Other useful admin-capable APIs include `GET {{baseUrl}}/properties`, `GET {{baseUrl}}/requirements/all`, and `GET {{baseUrl}}/builders`.

## User APIs

### Get My Profile

`GET {{baseUrl}}/user/profile`

Headers: auth required.
 
 Response includes a `stats` object with `shortlisted`, `contacted`, and `propertyViewed` counts.

### Update My Profile

`PUT {{baseUrl}}/user/profile`

Headers: auth required.

Body type: `json` or `form-data`.

Use `form-data` when uploading a profile image:

```txt
name = Rahul Sharma
email = rahul.new@example.com
agencyName = Prime Realty
profileImage = select jpg/jpeg/png/webp file
documents = select pdf/image/doc/docx file
documents = select another document file
```

JSON body without image:

```json
{
  "name": "Rahul Sharma",
  "email": "rahul.new@example.com",
  "agencyName": "Prime Realty"
}
```

Allowed update fields only: `name`, `phone`, `email`, `agencyName`.
Profile image is uploaded as file field `profileImage`; only the ImageKit file name is stored in DB, and APIs return `profileImageUrl`.
User documents are uploaded as repeated file field `documents`; only ImageKit file names are stored in DB, and APIs return `documentUrls`.

### Delete My Account

Permanently deletes the logged-in user account and all associated data in cascade.

`DELETE {{baseUrl}}/user/profile`

Headers: auth required.

**Cascading Delete:**
When a user is deleted, the following data is also removed:
- User account
- All shortlists
- All property visits/viewed properties
- All OTP records
- All reviews submitted by the user
- All requirements/leads shared
- All support tickets
- User status records
- All subscriptions
- Login/session logs
- Agent profile (if user is a broker or channel_partner)
- All properties (owned or managed by the user)
- All property documents (for user's properties)

**Database-Level Cascading:**
This cascading delete is enforced at the database level using MongoDB middleware. This means:
- ✓ Cascading deletes work when deleting via API endpoint
- ✓ Cascading deletes also work if a user is deleted directly from the database
- ✓ All related data is automatically cleaned up regardless of deletion method

**Response Example:**
```json
{
  "success": true,
  "message": "User account and all associated data deleted successfully",
  "data": {
    "userId": "64f000000000000000000002",
    "deletedAt": "2026-05-26T10:00:00.000Z"
  }
}
```

**Important:** This action is irreversible and will delete all user data from the system, whether deleted through the API or directly from the database.

## Agent APIs

All agent endpoints require auth. Only users with the role `broker` or `channel_partner` can register as agents.

### Register / Update Agent Profile

`POST {{baseUrl}}/agents/register` OR `POST {{baseUrl}}/agents/me`

Handles both creation and update of the agent profile for the logged-in user.

**Headers:** auth required.

**Body Type:** `form-data` (recommended if uploading image) or `json`.

**Fields:**

| Key | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` | Full name of the agent. (Allowed in Register & Update) |
| `email` | `String` | Contact email. (Allowed in Register & Update) |
| `phone number` | `String` | Contact phone number. (Allowed in Register & Update) |
| `agency_name` | `String` | Name of the real estate agency. (Allowed in Register & Update) |
| `country` | `String` | Country (Default: India). (Allowed in Register & Update) |
| `state` | `String` | State. (Allowed in Register & Update) |  
| `city` | `String` | City. (Allowed in Register & Update) |
| `expertInAreas` | `Array/String` | Areas of expertise. (**Update Only**) |
| `companyImage` | `File` | Optional company image. (**Update Only**) |

**Example (form-data):**

```txt
name = Rahul Sharma
email = rahul.agent@example.com
phone number = 9876543210
agency_name = Prime Realty
country = India
state = Gujarat
city = Ahmedabad
expertInAreas = ["Satellite", "Prahlad Nagar"]
companyImage = select logo.jpg
```

### Get Agents Around Me

Returns a list of agents who are experts in the specified location.

`GET {{baseUrl}}/agents/around-me/:location?page=1&limit=10`

**Headers:** auth required.

**Path Parameter:**
* `location`: The area name to search for in agent expertise (e.g., `Satellite`).

**Query Parameters:**
* `page`, `limit` (optional)

## Expert In Area APIs

These APIs allow professionals (`broker`, `channel_partner`, `builder`) to manage the list of sub-areas/localities where they are experts. This data is used in the notification matching engine — **brokers receive requirement/inquiry notifications only when their registered expert areas match the property area**.

All endpoints require auth (`Authorization: Bearer {{token}}`).

> **Ownership Rule:** Every API is scoped to the **logged-in user's own records only**. Users cannot view, update, or delete another user's expert area records. Attempting to access another user's record returns `404 Not Found` (for GET/DELETE) or `403 Forbidden` (for update).

---

### Add Expert Area

Registers a new sub-area/locality that the logged-in user is an expert in.

`POST {{baseUrl}}/expertInArea`

**Headers:** auth required.

**Body:**

```json
{
  "areaName": "Satellite"
}
```

- `areaName` is normalized to Sentence Case (e.g. `satellite` → `Satellite`).
- Duplicate area names per user are rejected with `409 Conflict`.

**Postman test:**

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("expertInAreaId", json.data._id);
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Expert in area created successfully",
  "data": {
    "_id": "664f0000000000000000abc1",
    "userId": "6a0ea275e194ff9a92e423e6",
    "areaName": "Satellite",
    "createdAt": "2026-05-29T10:00:00.000Z",
    "updatedAt": "2026-05-29T10:00:00.000Z",
    "deletedAt": null
  }
}
```

---

### Get My Expert Areas

Returns the list of active expert areas registered by the **currently logged-in user only**. Passing a `userId` query param has no effect — the response is always scoped to the auth user.

`GET {{baseUrl}}/expertInArea`

**Headers:** auth required.

**Query Parameters:**

| Param | Type | Description |
|:--|:--|:--|
| `search` | `String` | Optional. Case-insensitive partial match on `areaName`. |
| `page` | `Number` | Optional. For pagination. |
| `limit` | `Number` | Optional. For pagination. |

**Example:**

```
GET {{baseUrl}}/expertInArea?search=sat&page=1&limit=10
```

**Success Response:**

```json
{
  "success": true,
  "message": "Expert in areas fetched successfully",
  "data": [
    {
      "_id": "664f0000000000000000abc1",
      "userId": "6a0ea275e194ff9a92e423e6",
      "areaName": "Satellite",
      "createdAt": "2026-05-29T10:00:00.000Z"
    },
    {
      "_id": "664f0000000000000000abc2",
      "userId": "6a0ea275e194ff9a92e423e6",
      "areaName": "Prahlad nagar",
      "createdAt": "2026-05-29T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "meta": {
    "totalExpertInAreas": 2
  }
}
```

---

### Get Expert Area By ID

Returns a single expert area record by its ID, **only if it belongs to the logged-in user**.

`GET {{baseUrl}}/expertInArea/{{expertInAreaId}}`

**Headers:** auth required.

Returns `404 Not Found` if the record does not exist or belongs to another user.

---

### Update Expert Area

Updates the `areaName` of an expert area record owned by the logged-in user.

`PUT {{baseUrl}}/expertInArea/{{expertInAreaId}}`

**Headers:** auth required.

**Body:**

```json
{
  "areaName": "Bodakdev"
}
```

**Validation:**
- Returns `403 Forbidden` if the record belongs to another user.
- Returns `409 Conflict` if the user already has another active area with the same name.
- `areaName` is normalized to Sentence Case.

---

### Delete Expert Area

Permanently (hard) deletes an expert area record. Only deletes records **owned by the logged-in user**.

`DELETE {{baseUrl}}/expertInArea/{{expertInAreaId}}`

**Headers:** auth required.

Returns `404 Not Found` if the record does not exist or the user is not its owner.

**Success Response:**

```json
{
  "success": true,
  "message": "Expert in area deleted successfully"
}
```

---

### How Expert Areas Are Used in Notifications

Expert areas drive the notification matching engine:

- When a new **inquiry** or **requirement** is submitted, the system checks all broker users.
- A broker is notified **only if**:
  1. Their `city` (from `User` model) matches the property/requirement's city.
  2. One of their registered `ExpertInArea.areaName` values matches the property's `city_area` or the requirement's `area` field (case-insensitive regex).
- `channel_partner` and `builder` roles are notified on **city match only** — no expert area check.

Expert areas registered via this API are therefore directly linked to the notification broadcast scope for broker users.

---

## Builder APIs

All builder endpoints handle company information for users with the `builder` role.

### Register / Update Builder Profile

Creates or updates the builder profile for the logged-in user.

`POST {{baseUrl}}/builders/me`

**Headers:** auth required.

**Body:** `json`

```json
{
  "companyDetails": {
    "companyName": "Siddhi Developers",
    "groupName": "Siddhi Group of Companies",
    "yearEstablished": 2012,
    "about": "Siddhi Developers is one of the leading real estate brands in Gujarat, known for quality construction and timely delivery.",
    "website": "https://siddhidevelopers.com",
    "socialLinks": {
      "facebook": "https://facebook.com/siddhidevelopers",
      "instagram": "https://instagram.com/siddhidevelopers",
      "linkedin": "https://linkedin.com/company/siddhidevelopers"
    }
  }
}
```

### Get My Builder Profile

`GET {{baseUrl}}/builders/me`

**Headers:** auth required.

### Get All Builders

Public list of builders.

`GET {{baseUrl}}/builders?page=1&limit=10&search=Siddhi`

**Query Parameters:**
* `page`: Page number (default: 1)
* `limit`: Items per page (default: 10)
* `search`: Search by company name

### Get Builder By ID

`GET {{baseUrl}}/builders/:id`

### Delete My Builder Profile

Soft deletes the builder profile for the logged-in user.

`DELETE {{baseUrl}}/builders/me`

**Headers:** auth required.

## Master Data APIs

These resources are used to build dropdowns/filters for property forms.

### Amenities

Public read APIs:

```txt
GET {{baseUrl}}/amenities
GET {{baseUrl}}/amenities?search=pool&page=1&limit=10
GET {{baseUrl}}/amenities/{{amenityId}}
```

Protected write APIs:

```txt
POST {{baseUrl}}/amenities
PUT {{baseUrl}}/amenities/{{amenityId}}
DELETE {{baseUrl}}/amenities/{{amenityId}}
```

Create/update body:

```json
{
  "amenityName": "Swimming Pool"
}
```

Postman test for create:

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("amenityId", json.data._id);
}
```

### Furniture

Public read APIs:

```txt
GET {{baseUrl}}/furniture
GET {{baseUrl}}/furniture?search=bed&page=1&limit=10
GET {{baseUrl}}/furniture/{{furnitureId}}
```

Protected write APIs:

```txt
POST {{baseUrl}}/furniture
PUT {{baseUrl}}/furniture/{{furnitureId}}
DELETE {{baseUrl}}/furniture/{{furnitureId}}
```

Create/update body:

```json
{
  "furnitureName": "Bed"
}
```

### Nearby Places

Public read APIs:

```txt
GET {{baseUrl}}/nearby-places
GET {{baseUrl}}/nearby-places?city=Ahmedabad&locality=Satellite&placeType=School&page=1&limit=10
GET {{baseUrl}}/nearby-places/{{nearbyPlaceId}}
```

Protected write APIs:

```txt
POST {{baseUrl}}/nearby-places
PUT {{baseUrl}}/nearby-places/{{nearbyPlaceId}}
DELETE {{baseUrl}}/nearby-places/{{nearbyPlaceId}}
```

Create/update body:

```json
{
  "city": "Ahmedabad",
  "locality": "Satellite",
  "placeName": "Delhi Public School",
  "placeType": "School"
}
```

### Positive Keywords

Used by reviews for likes/good points.

Public read APIs:

```txt
GET {{baseUrl}}/positive-keywords
GET {{baseUrl}}/positive-keywords?search=clean&page=1&limit=10
GET {{baseUrl}}/positive-keywords/list
GET {{baseUrl}}/positive-keywords/{{positiveKeywordId}}
```

Protected write APIs:

```txt
POST {{baseUrl}}/positive-keywords
PUT {{baseUrl}}/positive-keywords/{{positiveKeywordId}}
DELETE {{baseUrl}}/positive-keywords/{{positiveKeywordId}}
```

Create/update body:

```json
{
  "name": "Good Connectivity"
}
```

### Negative Keywords

Used by reviews for dislikes/problems.

Public read APIs:

```txt
GET {{baseUrl}}/negative-keywords
GET {{baseUrl}}/negative-keywords?search=noisy&page=1&limit=10
GET {{baseUrl}}/negative-keywords/list
GET {{baseUrl}}/negative-keywords/{{negativeKeywordId}}
```

Protected write APIs:

```txt
POST {{baseUrl}}/negative-keywords
PUT {{baseUrl}}/negative-keywords/{{negativeKeywordId}}
DELETE {{baseUrl}}/negative-keywords/{{negativeKeywordId}}
```

Create/update body:

```json
{
  "name": "Traffic Noise"
}
```

### Expert In Area

Master data for areas where agents have expertise. Used by agents to specify their specialist locations.

Public read APIs:

```txt
GET {{baseUrl}}/expert-in-areas
GET {{baseUrl}}/expert-in-areas?search=Satellite&page=1&limit=10
GET {{baseUrl}}/expert-in-areas/{{expertInAreaId}}
```

Protected write APIs (require auth):

```txt
POST {{baseUrl}}/expert-in-areas
PUT {{baseUrl}}/expert-in-areas/{{expertInAreaId}}
DELETE {{baseUrl}}/expert-in-areas/{{expertInAreaId}}
```

Create/update body:

```json
{
  "areaName": "Satellite"
}
```

Postman test for create:

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("expertInAreaId", json.data._id);
}
```

**Schema:**
- `areaName` (String, required, unique) - Name of the area where agents have expertise.
- `createdAt` (Date) - Record creation timestamp.
- `updatedAt` (Date) - Record last update timestamp.
- `deletedAt` (Date) - Soft delete timestamp (null if not deleted).

**Response Example (List):**
```json
{
  "success": true,
  "message": "Expert in areas fetched successfully",
  "data": [
    {
      "_id": "64f000000000000000000001",
      "areaName": "Satellite",
      "createdAt": "2026-01-22T10:00:00.000Z",
      "updatedAt": "2026-01-22T10:00:00.000Z",
      "deletedAt": null
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  },
  "meta": {
    "totalExpertInAreas": 1
  }
}
```

  ## Property APIs

All property endpoints require auth.

### Create Property

Creates a property and optionally uploads images/videos to ImageKit.

`POST {{baseUrl}}/properties`

Headers: auth required.

Body type: `form-data`

Required text fields:

```txt
title = 3 BHK Flat For Sale
propertyName = Shivalik Heights
propertyCategory = Residential
propertyType = Apartment
listingType = Sale
city = Ahmedabad
city_area = SG Highway
state = Gujarat
locality = Satellite
address = Near ISKCON Cross Road
price = 8500000
area = 1450
```

Optional text fields:

```txt
dealerId = {{userId}}
priceUnit = total
measureType = sqft
carpetArea = 1200
bedrooms = 3
bathrooms = 3
balcony = 2
furnished = Semi
parking = true
lift = true
floor = 5
totalFloors = 12
facing = East
propertyAge = 2 years
availableFor = Family
agreementMonths = 0
deposit = 0
maintenance = 2500
possession = Ready to move
description = Spacious 3 BHK apartment.
status = Active
amenityIds = ["{{amenityId}}"]
furnishings = [{"furnishingId":"{{furnitureId}}","quantity":2}]
nearbyPlaces = [{"nearbyId":"{{nearbyPlaceId}}","distance":1.5,"distanceUnit":"km"}]
ownership = Freehold
flooring = Vitrified Tiles
waterSource = Municipal Corporation, Borewell
otherKeyFacilities = Gas pipeline, Internet connectivity
nearbyLandmarks = [{"category":"School","places":[{"name":"Sai School","distance":"2km"}]}]
locationCoordinates = {"latitude": 23.0786, "longitude": 72.5312}
keyHighlights = {"propertyFeatures":["Pet Friendly"],"projectHighlights":["Green Project"]}
floorPlans = [{"bhk":"3 BHK","superArea":"1169 sqft","price":"1.3Cr"}]
legalCertificates = {"certificates":[{"name":"Ec","isValid":true}]}
propWorthInsights = {"currentLocality":"Gota","localityTrend":[7200,7400]}
aiSummary = Unique project in Gota...
reviewTopics = ["Quality","Possession"]
preLeasedDetails = {"leaseAmount":"5.5L","leaseTenure":"5 years"}
approvedIndustryTypes = ["Electronics"]
keySpecifications = [{"label":"Cabins","value":"2"}]
projectDetails = {"projectName":"Nova","landZone":"Commercial"}
aboutProject = {"name":"Yash","totalUnits":183}
aboutLocality = {"name":"Memnagar","rating":4}
aboutDeveloper = {"name":"Group","experienceYears":34}
topAgents = [{"name":"Mahendra","agency":"Plinth"}]
```

File fields:

```txt
images = select image file, max 5
videos = select one video file, max 1
brochure = select PDF file, max 3 files
```

Allowed image types: `jpg`, `jpeg`, `png`, `webp`.
Allowed video types: `mp4`, `mpeg`, `mov`, `avi`.
Allowed brochure type: `pdf` only.
Max image size: 5 MB per file.
Max video size: 50 MB.
Max brochure size: **5 MB per PDF file**. Up to **3 PDFs** per property.
Brochure PDFs are uploaded to ImageKit under `properties/brochures/` and each entry in the `brochure` array gets a `url` field in the response.
Videos are temporarily stored on disk and streamed to ImageKit so large uploads are not kept in server memory.

Allowed enums:

```txt
propertyCategory: Residential, Commercial, PG
listingType: Sale, Rent
priceUnit: total, monthly
measureType: sqft, sqmt, yard, bigha
furnished: No, Semi, Yes
availableFor: Family, Bachelors, Anyone, Boys, Girls
status: Draft, Active, Inactive, Sold, Rented
distanceUnit: m, km
```

Postman test script:

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("propertyId", json.data._id);
}
```

### Get Properties

Returns paginated property cards/list data with advanced filtering based on the Custom Filter Screen requirements.

`GET {{baseUrl}}/properties?page=1&limit=10&locations=Ahmedabad,Satellite&sortBy=Price (H-L)`

**Headers:** auth required.

**Comprehensive Filtering Parameters:**

| Key | Type | Description |
| :--- | :--- | :--- |
| `locations` | `String` | Comma-separated cities, localities, or areas (searches city, locality, area, and address fields). |
| `propertyCategory`| `String` | Main category: `Residential`, `Commercial`, or `PG`. |
| `propertyTypes` | `String` | Comma-separated sub-types (e.g., `Flat/Apartment,House/Villa,Ready Offices`). |
| `minBudget` | `Number` | Minimum price (budget) in INR. |
| `maxBudget` | `Number` | Maximum price (budget) in INR. |
| `minArea` | `Number` | Minimum area size. |
| `maxArea` | `Number` | Maximum area size. |
| `postedBy` | `String` | Comma-separated poster types: `Owner`, `Agent`, `Builder`. |
| `saleType` | `String` | Comma-separated: `New`, `Resale`. (Maps to property age). |
| `furnishing` | `String` | Comma-separated: `Furnished`, `Semi-Furnished`, `Unfurnished`. |
| `amenities` | `String` | Comma-separated amenity names (e.g., `Parking,Lift,Pool`). Case-insensitive lookup. |
| `facing` | `String` | Comma-separated directions (e.g., `East,North,West-Facing`). |
| `minFloor` | `String` | Min floor level (e.g., `Ground`, `Basement`, `1`, `5th`). |
| `maxFloor` | `String` | Max floor level (e.g., `10`, `Top Floor`). |
| `sortBy` | `String` | `Price (H-L)`, `Price (L-H)`, `Most Recent`, `price_desc`, `price_asc`, `newest`, `oldest`. |
| `search` | `String` | Global keyword search across title, name, type, and address. |
| `page` / `limit` | `Number` | Pagination controls (Default: page 1, limit 10). |

**Legacy / ID-based filters (Still Supported):**
`city`, `locality`, `city_area`, `state`, `listingType`, `bhk`, `bedrooms`, `bathrooms`, `minPrice`, `maxPrice`, `ownerId`, `dealerId`.

**Example Complex Query:**
`{{baseUrl}}/properties?locations=Ahmedabad,Gota&propertyCategory=Residential&propertyTypes=Flat/Apartment&minBudget=5000000&postedBy=Agent&amenities=Parking,Lift&sortBy=Price (H-L)`


### Get My Properties

Returns properties uploaded/owned by the logged-in user. The user is taken from JWT.

`GET {{baseUrl}}/properties/my-property?page=1&limit=10&listingType=Sale&status=Active`

Headers: auth required.

Optional filters:

```txt
search
status
listingType
propertyCategory
propertyType
sortBy
page
limit
```

`sortBy` values: `price_asc`, `price_desc`, `oldest`, `newest`.

### Get Properties By User ID

Returns all properties associated with a specific user (where they are either the owner or the dealer).

`GET {{baseUrl}}/properties/user/:userId?page=1&limit=10&listingType=Sale&status=Active`
  
**Headers:** auth required.

**Path Parameter:**
* `userId`: The ID of the user whose properties you want to retrieve.

**Optional Filters:**
`page`, `limit`, `status`, `listingType`, `propertyCategory`, `propertyType`, `sortBy`.

`status` values: `Active`, `Inactive`, `Draft`, `Sold`, `Rented`.

`sortBy` values: `price_asc`, `price_desc`, `oldest`, `newest`.

### Get Property By ID

Returns full property details with populated owner/dealer/amenities/media URLs. This endpoint includes all technical audit fields for residential and commercial views.

`GET {{baseUrl}}/properties/{{propertyId}}`

**Headers:**
- `Authorization: Bearer {{token}}`

**Response Example:**

```json
{
  "success": true,
  "message": "Property fetched successfully",
  "data": {
    "_id": "6742fb0b28e23588df8e9766",
    "title": "3 BHK Flat For Sale in Unique Luxuria",
    "propertyName": "Unique Luxuria",
    "propertyCategory": "Residential",
    "propertyType": "Apartment",
    "listingType": "Sale",
    "city": "Ahmedabad",
    "price": 85000000,
    "locationCoordinates": {
      "latitude": 23.0786,
      "longitude": 72.5312
    },
    "nearbyLandmarks": [
      {
        "category": "Educational Institute",
        "icon": "school_outlined",
        "places": [
          { "name": "Sai City International School", "distance": "4.5 Km" },
          { "name": "Moulya School", "distance": "2.3 Km" }
        ]
      }
    ],
    "keyHighlights": {
      "propertyFeatures": ["Pet Friendly", "Power Backup", "Visitor Parking", "Security"],
      "projectHighlights": ["Green Project", "1.25 Lakh sq.ft. Central Park", "Modern Design"]
    },
    "floorPlans": [
      {
        "bhk": "3 BHK",
        "superArea": "1169 sq.ft.",
        "price": "₹1.3 Cr onwards",
        "estimatedEmi": "1L",
        "possessionDate": "Dec, 2025",
        "imageUrl": "https://images.unsplash.com/..."
      }
    ],
    "legalCertificates": {
      "lastUpdated": "2025-09-09",
      "certificates": [
        { "name": "Encumbrance Certificate", "isValid": true },
        { "name": "Commencement Certificate", "isValid": true },
        { "name": "Occupancy Certificate", "isValid": false }
      ]
    },
    "propWorthInsights": {
      "currentLocality": "Gota",
      "localityTrend": [7200, 7000, 7100, 6800, 7300],
      "projectTrend": [6000, 6100, 5900, 6000, 5800],
      "timeframe": "1Y"
    },
    "aiSummary": "Unique Luxuria in Gota is a highly recommended project with modern design...",
    "reviewTopics": ["Excellent Construction", "Timely Possession", "Luxurious Flats"],
    "aboutProject": {
      "name": "Yash Arian",
      "priceRange": "37.5 Lac - 1.05 Cr Onwards",
      "totalUnits": 183
    },
    "aboutLocality": {
      "name": "Memnagar",
      "pincode": "380052",
      "rating": 4.0,
      "totalReviews": 20
    },
    "topAgents": [
      {
        "name": "Mahendra Prajapati",
        "agency": "Plinth Realty",
        "experience": "Operating since 2023",
        "avatarUrl": "https://..."
      }
    ],
    "preLeasedDetails": {
      "leaseAmount": "₹ 5.5 L/month",
      "leaseTenure": "5.0 years"
    },
    "projectDetails": {
      "projectName": "Supernova Astralis",
      "landZone": "Commercial",
      "reraNumber": "UPRERAPRJ7263",
      "passengerLifts": "3 lifts",
      "occupancyCertificate": "Yes"
    },
    "media": [
      { "type": "image", "url": "https://ik.imagekit.io/..." }
    ],
    "postedBy": {
      "_id": "6742fb0b28e23588df8e9766",
      "name": "John Doe",
      "role": "broker",
      "profileImage": "profile_123.jpg",
      "profileImageUrl": "https://ik.imagekit.io/.../profile_123.jpg",
      "url": "https://ik.imagekit.io/.../profile_123.jpg"
    }
  }
}
```

  Notes:
  - The single-property response now includes a `postedBy` field (same semantics as the list `postedBy`): it contains the `dealerId` if present, otherwise the `ownerId`. 
  - `postedBy` includes `profileImageUrl` and `url` for the user's photo.
  Quick verification (replace placeholders):
  ```bash
  curl -H "Authorization: Bearer <TOKEN>" \
    "{{baseUrl}}/properties/<propertyId>"
  ```

---

### New Fields in Create / Update Property

The following new fields are accepted in the `POST /api/properties` and `PUT /api/properties/:id` body (send as JSON strings in `form-data` or directly in a JSON body):

| Field | Type | Description |
| :--- | :--- | :--- |
| `specifications` | `Array<String>` | Bullet points about construction & build quality. |
| `whyConsider` | `Array<String>` | Selling points / USPs of the property. |
| `preels` | `Array<Object>` | Short video reel highlights. See schema below. |
| `expertReviews` | `Array<Object>` | Market expert review cards. See schema below. |
| `legalCertificates` | `Array<Object>` | **Restructured** — now a per-certificate array. See schema below. |
| `projectInfo` | `Object` | Price range and total units for the project. |
| `localityInfo` | `Object` | Locality metadata: name, city, pincode, rating, reviewCount. |
| `developerInfo` | `Object` | Developer name, experience, address. |
| `viewStats` | `Object` | View count and period (auto-tracked or manually set). |
| `availableUnits` | `Array<Object>` | **Builder-Only** — Unit configurations/pricing for large projects. |
| `developer` | `Object` | **Builder-Only** — Rich developer/builder profile details. |

**`preels` item schema:**
```json
{ "imageUrl": "https://...", "title": "Project Name", "location": "Locality", "views": 150, "videoUrl": "https://..." }
```

**`expertReviews` item schema:**
```json
{ "videoThumbnail": "https://...", "videoUrl": "https://...", "reviewerName": "Expert", "channelName": "Channel", "subscribers": 124, "views": 5010 }
```

**`legalCertificates` item schema** (replaces the old `{lastUpdated, certificates[]}` format):
```json
{ "name": "Commencement Certificate", "isAvailable": true, "documentUrl": "https://...", "previewImageUrl": "https://...", "lastUpdated": "2025-09-09" }
```

**`projectInfo` schema:**
```json
{ "priceRange": { "min": 3750000, "max": 10500000 }, "totalUnits": 183 }
```

**`localityInfo` schema:**
```json
{ "name": "Memnagar", "city": "Ahmedabad", "pincode": "380052", "rating": 4.0, "reviewCount": 20 }
```

**`developerInfo` schema:**
```json
{ "name": "Yash Group", "yearsExperience": 34, "address": "Parshwanath Business Park..." }
```

**`viewStats` schema:**
```json
{ "viewCount": 67, "daysPeriod": 73 }
```

**`availableUnits` item schema (Builder/Admin Only):**
```json
{
  "bhk": "2 BHK Apartment",
  "bookingType": "New Bookings",
  "brokerage": "Zero Brokerage",
  "sizeRange": "617 - 629 sqft (57 - 58 sqm)",
  "areaType": "Carpet Area",
  "price": "₹58.5 Lac onwards",
  "priceSqft": "₹4,200 /sqft",
  "optionsCount": 3,
  "updatedText": "Updated 2 mo. ago",
  "paymentPlan": "Construction-linked Plan",
  "paymentPlanSubtitle": "Payment Plans & banks"
}
```

**`developer` schema (Builder/Admin Only):**
```json
{
  "name": "Vivaan Group",
  "logo": "https://...",
  "experience": "13",
  "totalProjects": "8",
  "cities": "1",
  "description": "Vivaan Group is committed to...",
  "deliveredCount": "3",
  "recentlyDeliveredCount": "3",
  "ongoingCount": "5"
}
```

> **Note:** The `availableUnits` and `developer` fields are strictly filtered at the API level. They are only accepted during creation/update and visible in responses if the authenticated user has the role `builder` or `admin`.

---

### Get Similar Properties

Returns properties similar to a given property (same city, category, and type).

`GET {{baseUrl}}/properties/{{propertyId}}/similar?limit=10`

**Headers:** auth required.

**Query:** `limit` (optional, default 10).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "propertyId": "abc123",
      "title": "3 BHK Apartment in Satellite",
      "location": "Satellite, Ahmedabad",
      "price": 8500000,
      "pricePerSqft": 5862,
      "bhk": 3,
      "propertyType": "Apartment",
      "status": "Active",
      "propertyAge": "2 years",
      "coverImage": "https://ik.imagekit.io/..."
    }
  ]
}
```

---

### Get Property Price Trends

Returns the PropWorth chart data (project + locality price trends) stored against a property.

`GET {{baseUrl}}/properties/{{propertyId}}/price-trends`

**Headers:** auth required.

**Response:**
```json
{
  "success": true,
  "data": {
    "localityName": "Gota",
    "projectName": "Unique Luxuria",
    "timeframe": "1Y",
    "projectPriceTrend": [
      { "date": "2024-01", "pricePerSqft": 5600 },
      { "date": "2024-06", "pricePerSqft": 6200 },
      { "date": "2025-01", "pricePerSqft": 7200 }
    ],
    "localityPriceTrend": [
      { "date": "2024-01", "pricePerSqft": 5200 },
      { "date": "2025-01", "pricePerSqft": 6800 }
    ]
  }
}
```

> Trend data is sourced from `propWorthInsights.projectTrend` / `localityTrend` stored on the property and mapped to date labels automatically.

---

### Get Popular Properties

Returns the most recently active properties — used for the "Popular Projects" stack on detail pages.

`GET {{baseUrl}}/properties/popular?city=Ahmedabad&limit=30&listingType=Sale&propertyCategory=Residential`

**Headers:** auth required.

**Query Parameters:**

| Key | Type | Description |
| :--- | :--- | :--- |
| `city` | `String` | Filter by city (case-insensitive). |
| `limit` | `Number` | Max results (default 30). |
| `listingType` | `String` | `Sale` or `Rent`. |
| `propertyCategory` | `String` | `Residential`, `Commercial`, or `PG`. |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCount": 56,
    "city": "Ahmedabad",
    "properties": [
      {
        "propertyId": "...",
        "title": "Atithi Highline",
        "location": "Gota, Ahmedabad",
        "price": 15900000,
        "config": "3 BHK Apartment",
        "possessionYear": "Dec 2026",
        "coverImage": "https://ik.imagekit.io/..."
      }
    ]
  }
}
```

---

### Get Property Count

Returns the count of active properties matching the given filters — used for the "2867 New Projects in Ahmedabad" banner.

`GET {{baseUrl}}/properties/count?city=Ahmedabad&listingType=Sale`

**Headers:** auth required.

**Query Parameters:** `city`, `listingType`, `propertyCategory`, `status` (optional — defaults to `Active`).

**Response:**
```json
{
  "success": true,
  "data": { "count": 2867, "city": "Ahmedabad" }
}
```

---

### Update Property


Updates property fields and optionally appends new images/videos.

`PUT {{baseUrl}}/properties/{{propertyId}}`

Headers: auth required.

Body type: `form-data`

Example fields:

```txt
title = Updated 3 BHK Flat
price = 8300000
status = Active
parking = true6
amenityIds = ["{{amenityId}}"]
furnishings = [{"furnishingId":"{{furnitureId}}","quantity":1}]
nearbyPlaces = [{"nearbyId":"{{nearbyPlaceId}}","distance":1,"distanceUnit":"km"}]
images = select new image file
videos = select new video file
brochure = select PDF file
```

Note: uploaded images are appended to existing images. Uploaded video replaces the existing video because only one video is allowed per property. Uploaded brochures are **appended** to existing brochures (up to 3 total). Only `pdf` files are accepted for the `brochure` field; max 5 MB per file.

### Delete Property

Soft deletes a property.

`DELETE {{baseUrl}}/properties/{{propertyId}}`

Headers: auth required.

### Upload Property Brochure (Standalone, Owner/Dealer Unique)

Uploads a standalone brochure PDF for a property. Only the authorized owner/dealer of the property (or admin) can upload brochures.

`POST {{baseUrl}}/properties/{{propertyId}}/brochure`

Headers:
- `Authorization: Bearer <ACCESS_TOKEN>`
- `Content-Type: multipart/form-data`

Body (Form Data):
- `brochure` (file, required): select PDF file (max 5 MB).

Note: Each property can have at most 3 brochures. Uploaded brochures are appended.

Response Example (`200 OK`):
```json
{
  "success": true,
  "message": "Brochure uploaded successfully",
  "data": {
    "fileName": "1716982462000-brochure.pdf",
    "uploadedAt": "2026-05-29T12:00:00.000Z",
    "url": "https://ik.imagekit.io/aj6cyp5nm/properties/brochures/1716982462000-brochure.pdf"
  }
}
```

## Property Document APIs

All property document endpoints require auth.

### Upload Property Document

Uploads a document for a property.

`POST {{baseUrl}}/property-documents`

Headers: auth required.

Body type: `form-data`

```txt
propertyId = {{propertyId}}
documentType = Ownership Proof
title = Sale Deed
document = select pdf/jpg/jpeg/png/doc/docx file
```

Allowed `documentType`:

```txt
Ownership Proof
Agreement
Floor Plan
Brochure
Property Tax Receipt
ID Proof
Other
```

Document status is managed by the system:
- Default on upload: `Pending`
- Admin approves: `Approved`
- Admin rejects: `Rejected`
- User edits document: automatically reset to `Pending`


Allowed file types: `pdf`, `jpg`, `jpeg`, `png`, `doc`, `docx`.
Max file size: 5 MB.

Note: in the current create API, the file upload result is hardcoded as `test-file.pdf`. Update API uses actual ImageKit upload.

Postman test script:

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("documentId", json.data._id);
}
```

### Get Property Documents

`GET {{baseUrl}}/property-documents?propertyId={{propertyId}}&page=1&limit=10`

Headers: auth required.

Optional filters: `propertyId`, `documentType`, `status`, `page`, `limit`.

Notes:
- This endpoint is restricted to documents belonging to properties owned or managed by the requesting user. If you query with `propertyId`, the API will verify that the logged-in user is the `ownerId` or `dealerId` of that property (admins bypass this check). If the user does not own/manage the property, a `403 Forbidden` is returned.

Quick verification (replace placeholders):
```bash
# Get documents for a specific property (will verify ownership)
curl -H "Authorization: Bearer <TOKEN>" \
  "{{baseUrl}}/property-documents?propertyId=<propertyId>&page=1&limit=10"

# Get documents for properties owned/managed by the logged-in user
curl -H "Authorization: Bearer <TOKEN>" \
  "{{baseUrl}}/property-documents?page=1&limit=10"
```

### Get Property Document By ID

`GET {{baseUrl}}/property-documents/{{documentId}}`

Headers: auth required.

### Update Property Document

`PUT {{baseUrl}}/property-documents/{{documentId}}`

Headers: auth required.

Body type: `form-data`

```txt
title = Updated Sale Deed
documentType = Agreement
document = select optional replacement file
```

> **Note:** Any update to a document automatically resets its `status` back to `Pending` for re-review by admin.

### Update Document Status (Admin)

`PATCH {{baseUrl}}/property-documents/{{documentId}}/status`

Headers: auth required.

Body (JSON):

```json
{
  "status": "Approved"
}
```

Allowed `status` values: `Pending`, `Approved`, `Rejected`.

Error cases:

| Status | Reason |
|--------|--------|
| `400 Bad Request` | Invalid status value |
| `404 Not Found` | Document does not exist or has been soft-deleted |


### Delete Property Document

`DELETE {{baseUrl}}/property-documents/{{documentId}}`

Headers: auth required.

## Review APIs

### Create Review

Creates one review per user per property.

`POST {{baseUrl}}/reviews`

Headers: auth required.

Body:

```json
{
  "propertyId": "{{propertyId}}",
  "userType": "Tenant",
  "stayDuration": "1 year",
  "connectivity": 4,
  "lifestyle": 5,
  "safety": 4,
  "environment": 3,
  "positive": "Good society and connectivity.",
  "negative": "Traffic during peak hours.",
  "positiveKeywordIds": ["{{positiveKeywordId}}"],
  "negativeKeywordIds": ["{{negativeKeywordId}}"]
}
```

Allowed `userType`: `Owner`, `Tenant`.
Ratings must be numbers from 1 to 5.

### Get Reviews

Public endpoint.

```txt
GET {{baseUrl}}/reviews
GET {{baseUrl}}/reviews?propertyId={{propertyId}}&page=1&limit=10
```

### Get Property Review Summary

Public endpoint. Returns rating averages, star distribution, and keyword mention counts.

`GET {{baseUrl}}/reviews/property/{{propertyId}}/summary`

## Shortlist APIs

All shortlist endpoints require auth.

### Add To Shortlist

`POST {{baseUrl}}/shortlist`

Body:

```json
{
  "propertyId": "{{propertyId}}"
}
```

### My Shortlisted Properties

`GET {{baseUrl}}/shortlist/my?page=1&limit=10`

### Check Shortlist Status

`GET {{baseUrl}}/shortlist/status/{{propertyId}}`

Response data:

```json
{
  "propertyId": "property id",
  "isShortlisted": true
}
```

### Remove From Shortlist

`DELETE {{baseUrl}}/shortlist/{{propertyId}}`

## User Status APIs

### My User Status

Counts logged-in user's property stats.

`GET {{baseUrl}}/user-status/my`

Headers: auth required.

### User Status By User ID

Public endpoint.

`GET {{baseUrl}}/user-status/{{userId}}`

Returns counts like listed, sale, rent, active, inactive properties.

## Agent APIs

All agent endpoints require auth.

Agent profile uses `userId` as a foreign key to the logged-in user. Agent response takes `name` and `profileImage` from the User model and returns `profileImageUrl`. Company image is uploaded to ImageKit like user/property images, and APIs return `companyImageUrl`.

### Register Agent

Registers the logged-in user as an agent. Only users with role `broker` or `channel_partner` can register as an agent.

`POST {{baseUrl}}/agents/register`

Headers: auth required.

Body type: `form-data`.

```txt
companyName = Shree Realty
expertInAreas = ["Satellite","Bopal","SG Highway"]
companyImage = select jpg/jpeg/png/webp file
```

You can also send `expertInAreas` as comma-separated text:

```txt
expertInAreas = Satellite,Bopal,SG Highway
```

Allowed image types: `jpg`, `jpeg`, `png`, `webp`.

Max image size: 5 MB.

If the logged-in user role is not `broker` or `channel_partner`, API returns forbidden:

```json
{
  "success": false,
  "message": "Only broker and channel_partner users can register as agents"
}
```

Successful response includes:

```json
{
  "success": true,
  "message": "Agent profile saved successfully",
  "data": {
    "_id": "agent id",
    "userId": "user id",
    "name": "Amit Broker",
    "profileImage": "user-profile-file-name.jpg",
    "profileImageUrl": "https://ik.imagekit.io/.../users/profile-images/user-profile-file-name.jpg",
    "propertiesListed": 10,
    "verifiedProperties": 4,
    "expertInAreas": ["Satellite", "Bopal", "SG Highway"],
    "companyName": "Shree Realty",
    "companyImage": "company-file-name.jpg",
    "companyImageUrl": "https://ik.imagekit.io/.../agents/company-images/company-file-name.jpg"
  }
}
```

### Create Or Update My Agent Profile

Same as register agent. This endpoint can be used when the frontend wants a "save my agent profile" API name.

`POST {{baseUrl}}/agents/me`

Headers: auth required.

Body type: `form-data`.

Fields are same as `POST /agents/register`: `companyName`, `expertInAreas`, `companyImage`.

### Get Agents Around Me

Returns agents whose `expertInAreas` match the passed location.

`GET {{baseUrl}}/agents/around-me/Satellite?page=1&limit=10`

Headers: auth required.

Path params:

```txt
location = Satellite
```

Optional query params:

```txt
page = 1
limit = 10
```

Response includes user name/profile image, agent company data, property count, verified property count, and expert areas.

## Subscription Plan Admin APIs

All subscription plan endpoints require an admin auth token.

### Create Subscription Plan

`POST {{baseUrl}}/subscription-plans`

Body:

```json
{
  "planName": "Premium",
  "planDescription": "Better visibility for serious sellers",
  "durationInMonths": 3,
  "listingVisibilityPercentage": 75,
  "planBenefits": ["Higher property ranking", "More buyer reach"],
  "planPrice": 2999,
  "isActive": true
}
```

### Get Subscription Plans

`GET {{baseUrl}}/subscription-plans?page=1&limit=10&search=premium&isActive=true`

Optional query params: `page`, `limit`, `search`, `isActive`.

### Get Subscription Plan By ID

`GET {{baseUrl}}/subscription-plans/{{subscriptionPlanId}}`

### Update Subscription Plan

`PUT {{baseUrl}}/subscription-plans/{{subscriptionPlanId}}`

Send any fields from the create body.

### Delete Subscription Plan

Soft deletes a subscription plan.

`DELETE {{baseUrl}}/subscription-plans/{{subscriptionPlanId}}`

## User Subscription APIs

All user subscription endpoints require auth.

### Active Plans For User

Returns active plans that users can buy.

`GET {{baseUrl}}/user-subscriptions/plans`

### Buy Subscription Plan

Creates an active subscription for the logged-in user. For now, this marks payment as paid directly until a payment gateway is added.

`POST {{baseUrl}}/user-subscriptions/buy`

Body:

```json
{
  "planId": "{{subscriptionPlanId}}"
}
```

Note: only one active subscription is allowed per user. Expired active subscriptions are marked expired automatically during subscription checks.

### My Subscriptions

`GET {{baseUrl}}/user-subscriptions/my?page=1&limit=10&status=active`

Optional query params: `page`, `limit`, `status`.

Allowed `status` values: `pending`, `active`, `expired`, `cancelled`.

### My Active Subscription

`GET {{baseUrl}}/user-subscriptions/active`

## User Home API

Returns all home screen sections in one response:

- `recentlyVisited`: last 10 unique properties opened by logged-in user.
- `newLaunchProperties`: latest 5 properties by created time.
- `sponsoredProperties`: currently latest 3 properties, marked with `isSponsored: true`.
- `topAreas`: top visited city areas, each with top 3 properties by visit count.

`GET {{baseUrl}}/user-home`

Headers: auth required.

Optional query params:

```txt
visitedLimit = 10
newLaunchLimit = 5
sponsoredLimit = 3
topAreaLimit = 3
topPropertyLimit = 3
```

### My Visited Properties

Returns all properties visited by the logged-in user, sorted by latest visit.

`GET {{baseUrl}}/user-home/visited-properties?page=1&limit=10`

Headers: auth required.

Optional query params:

```txt
page = 1
limit = 10
```

Each item includes normal property card fields plus `visitCount` and `lastVisitedAt`.

Note: user visits are recorded automatically when `GET /properties/{{propertyId}}` is called.

## Requirement APIs (Share Requirement)

All requirement endpoints require auth.

### Share Requirement (Create)

Users share what they are looking for so agents can find matches.

`POST {{baseUrl}}/requirements`

Headers: auth required.

Body (JSON):

```json
{
  "transactionType": "Buy",
  "locations": ["Ahmedabad", "Satellite"],
  "propertyTypes": ["Apartment", "Independent House"],
  "bhks": ["2 BHK", "3 BHK"],
  "minBudget": 5000000,
  "maxBudget": 10000000,
  "minArea": 1000,
  "maxArea": 2000,
  "furnishingStatus": ["Semi-Furnished"],
  "constructionStatus": ["Ready to Move"],
  "lookingTo": "Family",
  "minimumBathrooms": 2,
  "isReraApproved": true
}
```

Wait, most fields are optional and vary by type (Residential vs Commercial vs PG) as per the Theory Guide.

Example Response:

```json
{
  "success": true,
  "message": "Requirement shared successfully",
  "data": {
    "_id": "64f000000000000000000001",
    "userId": "64f000000000000000000002",
    "transactionType": "Buy",
    "locations": ["Ahmedabad", "Satellite"],
    "status": "Active",
    "createdAt": "2024-05-22T10:00:00.000Z"
  }
}
```

### Get My Requirements

Returns a list of requirements submitted by the logged-in user. By default, only **Active** requirements are shown.

`GET {{baseUrl}}/requirements/my`

**Query Parameters:**
- `status` (string, optional) - Filter by status (e.g., `Active`, `Inactive`, `Fulfilled`, `Closed`). Use `All` to see everything.

### Get All Requirements (Lead Discovery for Agents)

Allows agents to discover buyer/renter leads. By default, only **Active** requirements are shown.

`GET {{baseUrl}}/requirements/all?city=Ahmedabad&transactionType=Buy&page=1&limit=10`

**Constraint:** Only accessible by users with roles `broker`, `channel_partner`, `builder`, or `admin`.

**Query Parameters:**
- `status` (string, optional) - Filter by status (defaults to `Active`).
- `transactionType`, `city`, `minBudget`, `maxBudget`, `page`, `limit`.

### Get Requirements For Me (Role-Based Filtered Feed)

Returns requirements **automatically filtered based on the logged-in user's role and location profile**. This is the recommended endpoint for brokers and builders to discover relevant leads without manually entering city/area filters — the API derives the scope entirely from the user's profile.

`GET {{baseUrl}}/requirements/for-me`

**Headers:** auth required.

**Constraint:** Only accessible by users with roles `broker`, `channel_partner`, `builder`, or `admin`.

#### How Filtering Works

| Role | What is returned |
|:--|:--|
| `broker` | Requirements whose `locations[]` **contains the broker's city** AND whose `area` **matches one of the broker's registered ExpertInArea records** (case-insensitive). Requirements with **no area set** are always included for city-matched brokers (open requirements). |
| `builder` / `channel_partner` | Requirements whose `locations[]` **contains the user's city** (no area check). |
| `admin` | **All** requirements — no location filter applied. |

> **Important:** The user's `city` field in their profile is used as the location anchor. If the logged-in user does not have a `city` set in their profile, the API returns `400 Bad Request` with a message prompting them to update their profile first.

> **Broker area matching:** Broker area eligibility is driven by `ExpertInArea` records registered via `POST /expertInArea`. If a broker has no expert area records, they will only see requirements with **no area constraint** in their city.

#### Query Parameters

| Param | Type | Default | Description |
|:--|:--|:--|:--|
| `reqStatus` | `String` | `Active` | Filter by requirement status. Use `All` to return all statuses. Allowed: `Active`, `Inactive`, `Fulfilled`, `Closed`, `All`. |
| `transactionType` | `String` | — | Optional. Filter by transaction type: `Buy`, `Rent`, `Commercial`. |
| `page` | `Number` | `1` | Page number for pagination. |
| `limit` | `Number` | `10` | Results per page. |

#### Example Requests

```txt
# Active requirements in my city (default)
GET {{baseUrl}}/requirements/for-me

# All statuses
GET {{baseUrl}}/requirements/for-me?reqStatus=All

# Only Buy requirements, page 2
GET {{baseUrl}}/requirements/for-me?transactionType=Buy&page=2&limit=5
```

#### Success Response

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f000000000000000000001",
      "userId": {
        "_id": "64f000000000000000000002",
        "name": "Rahul Sharma",
        "phone": "9876543210",
        "email": "rahul@example.com"
      },
      "transactionType": "Buy",
      "locations": ["Ahmedabad", "Satellite"],
      "area": "Satellite",
      "propertyTypes": ["Apartment"],
      "bhks": ["2 BHK", "3 BHK"],
      "minBudget": 5000000,
      "maxBudget": 10000000,
      "status": "Active",
      "createdAt": "2026-05-22T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

#### Error Cases

| Status | Reason |
|:--|:--|
| `400 Bad Request` | The logged-in user's profile does not have a `city` set. |
| `403 Forbidden` | The user's role is `user` — endpoint is professional-only. |

---

### Get Requirement Detail

Returns full details for a specific requirement.

`GET {{baseUrl}}/requirements/{{requirementId}}`

### Get Matched Properties for Requirement

Returns properties that match the criteria of a specific requirement, including a **matchPercentage**.

`GET {{baseUrl}}/requirements/{{requirementId}}/matches`

Example Response:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64f0b...",
      "title": "Luxury Apartment",
      "price": 7500000,
      "matchPercentage": 100
    },
    {
      "_id": "64f0c...",
      "title": "Standard Flat",
      "price": 5500000,
      "matchPercentage": 75
    }
  ]
}
```

### Update Requirement

Allows the **owner** of a requirement to update it. Fields not sent are left unchanged. Protected fields (`userId`, `createdAt`, `deletedAt`) are ignored even if sent.

`PUT {{baseUrl}}/requirements/{{requirementId}}`

Headers: auth required.

Body (JSON — all fields optional, send only what you want to change):

```json
{
  "status": "Fulfilled",
  "locations": ["Mumbai", "Thane"],
  "propertyTypes": ["Apartment"],
  "bhks": ["2 BHK", "3 BHK"],
  "minBudget": 5000000,
  "maxBudget": 12000000,
  "minArea": 900,
  "maxArea": 2200,
  "furnishingStatus": ["Fully Furnished"],
  "constructionStatus": ["Ready to Move"],
  "minimumBathrooms": 2,
  "isReraApproved": false
}
```

Allowed `status` values: `Active`, `Fulfilled`, `Closed`.

Example Response:

```json
{
  "success": true,
  "message": "Requirement updated successfully",
  "data": {
    "_id": "64f000000000000000000001",
    "userId": "64f000000000000000000002",
    "transactionType": "Buy",
    "locations": ["Mumbai", "Thane"],
    "status": "Fulfilled",
    "updatedAt": "2024-05-25T10:00:00.000Z"
  }
}
```

Error cases:

| Status | Reason |
|--------|--------|
| `403 Forbidden` | Logged-in user is not the owner of this requirement |
| `404 Not Found` | Requirement does not exist or has been soft-deleted |

### Toggle Requirement Status (Active/Inactive)

Toggles the status of a requirement between `Active` and `Inactive`. This replaces the previous delete functionality.

`PATCH {{baseUrl}}/requirements/{{requirementId}}/status`

**Response Example:**
```json
{
  "success": true,
  "message": "Requirement marked as Inactive",
  "data": { ... }
}
```


## Privacy Policy APIs

### Get Active Privacy Policy (Public — User Side)

Returns the currently active privacy policy with full HTML content. No auth required.

`GET {{baseUrl}}/privacy-policy`

Example Response:

```json
{
  "success": true,
  "data": {
    "_id": "64f000000000000000000010",
    "title": "Privacy Policy",
    "content": "<h1>Privacy Policy</h1><p>...</p>",
    "isActive": true,
    "createdAt": "2026-01-22T10:00:00.000Z",
    "updatedAt": "2026-01-22T10:00:00.000Z"
  }
}
```

> **Note:** The `content` field is raw HTML. Render it directly with `innerHTML` or a safe HTML renderer on the frontend.

---

### Admin CRUD (Admin Auth Required)

All admin routes require `Authorization: Bearer {{token}}` with an `admin` role account.

#### Create Privacy Policy

`POST {{baseUrl}}/privacy-policy/admin`

Body (JSON — `content` is HTML):

```json
{
  "title": "Privacy Policy",
  "isActive": true,
  "content": "<h1>Privacy Policy</h1>\n<p><strong>Last Updated:</strong> January 22, 2026</p>\n<hr />\n<h2>Welcome to RealEstate</h2>\n<p>RealEstate is India's No. 1 Property Portal. We value your privacy and are committed to protecting your personal data.</p>\n<hr />\n<h3>01. Information We Collect</h3>\n<p>We collect personal information such as name, email, phone number, and account details. We also collect technical data like IP address, device type, and usage behavior.</p>\n<h3>02. Use of Information</h3>\n<p>Your data is used to operate, maintain, and improve our services, personalize user experience, and provide customer support.</p>\n<h3>03. Information Sharing</h3>\n<p>RealEstate does not sell personal data. Information may be shared with trusted partners or legal authorities when required by law.</p>\n<h3>04. Data Security</h3>\n<p>We implement reasonable technical and organizational measures to protect your information against unauthorized access.</p>\n<h3>05. User Rights</h3>\n<p>You may access, update, or request deletion of your personal information by contacting us or through your account settings.</p>\n<hr />\n<div class=\"important-notice\">\n  <strong>Consent</strong>\n  <p>By using RealEstate, you agree to this Privacy Policy.</p>\n</div>\n<hr />\n<h2>Contact Us</h2>\n<ul>\n  <li><strong>Email:</strong> legal@RealEstate.com</li>\n  <li><strong>Phone:</strong> +91-22-1234-5678</li>\n  <li><strong>Location:</strong> RealEstate, Mumbai, India</li>\n</ul>"
}
```

Rules:
- If `isActive` is `true`, all other existing policies are automatically deactivated.
- If `content` is omitted, the built-in default HTML content is used.
- Only one policy should be active at a time.

Postman test script:

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("privacyPolicyId", json.data._id);
}
```

#### Get All Privacy Policies (Admin)

Returns paginated list of all versions (including inactive).

`GET {{baseUrl}}/privacy-policy/admin?page=1&limit=10&isActive=true`

Optional query params: `page`, `limit`, `isActive`.

#### Get Privacy Policy By ID (Admin)

`GET {{baseUrl}}/privacy-policy/admin/{{privacyPolicyId}}`

#### Update Privacy Policy (Admin)

`PUT {{baseUrl}}/privacy-policy/admin/{{privacyPolicyId}}`

Body (send only fields to change):

```json
{
  "title": "Updated Privacy Policy",
  "isActive": true,
  "content": "<h1>Updated Privacy Policy</h1><p>...</p>"
}
```

Note: Setting `isActive: true` on this record will auto-deactivate all other policy records.

#### Delete Privacy Policy (Admin — Soft Delete)

`DELETE {{baseUrl}}/privacy-policy/admin/{{privacyPolicyId}}`

Soft deletes the policy and sets `isActive: false`.

---


## Terms & Conditions APIs

### Get Active Terms & Conditions (Public — User Side)

Returns the currently active Terms & Conditions with full HTML content. No auth required.

`GET {{baseUrl}}/terms-conditions`

Example Response:

```json
{
  "success": true,
  "data": {
    "_id": "64f000000000000000000020",
    "title": "Terms & Conditions",
    "content": "<h1>Terms &amp; Conditions</h1><p>...</p>",
    "isActive": true,
    "createdAt": "2026-01-22T10:00:00.000Z",
    "updatedAt": "2026-01-22T10:00:00.000Z"
  }
}
```

> **Note:** The `content` field is raw HTML. Render it directly with `innerHTML` or a safe HTML renderer on the frontend.

---

### Admin CRUD (Admin Auth Required)

All admin routes require `Authorization: Bearer {{token}}` with an `admin` role account.

#### Create Terms & Conditions

`POST {{baseUrl}}/terms-conditions/admin`

Body (JSON — `content` is HTML):

```json
{
  "title": "Terms & Conditions",
  "isActive": true,
  "content": "<h1>Terms &amp; Conditions</h1>\n<p><strong>Last Updated:</strong> January 22, 2026</p>\n<hr />\n<h2>Welcome to RealEstate</h2>\n<p>RealEstate is India's No. 1 Property Portal. By accessing our platform, you agree to our Terms &amp; Conditions.</p>\n<hr />\n<h3>01. General Terms &amp; Conditions</h3>\n<p>These Terms constitute a legally binding agreement between you and <strong>RealEstate</strong> regarding your use of <a href=\"http://www.RealEstate.com\">www.RealEstate.com</a>.</p>\n<h3>02. User Agreement</h3>\n<p>By using the Site and Services, you agree to be bound by these Terms. Continued use constitutes acceptance of any updates.</p>\n<h3>03. Privacy &amp; Data</h3>\n<p>Our Privacy Policy explains how we collect, use, and protect your personal information. By using our services, you consent to such processing.</p>\n<h3>04. Service Terms</h3>\n<p>RealEstate provides a platform for property listings and related services. We do not guarantee listing accuracy.</p>\n<hr />\n<div class=\"warning-notice\"><strong>Important Notice</strong><p>These Terms may be updated periodically. Continued use after updates constitutes acceptance.</p></div>\n<div class=\"important-notice\"><strong>Acceptance of Terms</strong><p>By continuing to use RealEstate, you agree to be bound by these Terms &amp; Conditions.</p></div>\n<hr />\n<h2>Contact Us</h2>\n<ul>\n  <li><strong>Email:</strong> legal@RealEstate.com</li>\n  <li><strong>Phone:</strong> +91-22-1234-5678</li>\n  <li><strong>Location:</strong> RealEstate, Mumbai, India</li>\n</ul>"
}
```

Rules:
- If `isActive` is `true`, all other existing records are automatically deactivated.
- If `content` is omitted, the built-in default HTML content (full T&C) is used.
- Only one record should be active at a time.

Postman test script:

```js
const json = pm.response.json();
if (json.data && json.data._id) {
  pm.environment.set("termsConditionsId", json.data._id);
}
```

#### Get All Terms & Conditions (Admin)

Returns paginated list of all versions (including inactive).

`GET {{baseUrl}}/terms-conditions/admin?page=1&limit=10&isActive=true`

Optional query params: `page`, `limit`, `isActive`.

#### Get Terms & Conditions By ID (Admin)

`GET {{baseUrl}}/terms-conditions/admin/{{termsConditionsId}}`

#### Update Terms & Conditions (Admin)

`PUT {{baseUrl}}/terms-conditions/admin/{{termsConditionsId}}`

Body (send only fields to change):

```json
{
  "title": "Updated Terms & Conditions",
  "isActive": true,
  "content": "<h1>Updated Terms &amp; Conditions</h1><p>...</p>"
}
```

Note: Setting `isActive: true` on this record will auto-deactivate all other T&C records.

#### Delete Terms & Conditions (Admin — Soft Delete)

`DELETE {{baseUrl}}/terms-conditions/admin/{{termsConditionsId}}`

Soft deletes the record and sets `isActive: false`.

## Help & Support APIs

This section outlines the API endpoints, database fields, and JSON payloads required to support the Help & Support features.

### 1. Fetch Support Data & FAQs
Fetches support contact details, help topics, and frequently asked questions (FAQs). Supports search and category filtering. If the database is empty, it automatically populates default data.

*   **Method:** `GET`
*   **Path:** `{{baseUrl}}/support`
*   **Query Parameters:**
    *   `search` (string, optional) - Filters FAQs based on the search query (questions and answers).
    *   `topic` (string, optional) - Filters FAQs by a specific Help Topic ID.

#### Response JSON Payload (`200 OK`)
```json
{
  "success": true,
  "data": {
    "supportContact": {
      "phone": "+91 9574156067",
      "email": "support@realestate.com",
      "availability": "24/7"
    },
    "helpTopics": [
      {
        "id": "user_profile",
        "title": "User Profile",
        "iconKey": "person_outline"
      },
      {
        "id": "search_properties",
        "title": "Search Properties",
        "iconKey": "search"
      },
      {
        "id": "realestate_features",
        "title": "RealEstate Features",
        "iconKey": "featured_play_list_outlined"
      },
      {
        "id": "realestate_prime",
        "title": "RealEstate Prime",
        "iconKey": "star_border"
      },
      {
        "id": "payments",
        "title": "Payments & Billing",
        "iconKey": "payment"
      },
      {
        "id": "property_listings",
        "title": "Property Listings",
        "iconKey": "home_work_outlined"
      }
    ],
    "faqs": [
      {
        "id": "faq_001",
        "topicId": "user_profile",
        "question": "How can I de-activate my account?",
        "answer": "To deactivate your RealEstate account, please login to your profile settings and select the 'Deactivate Account' option. Your data will be preserved for 30 days."
      },
      {
        "id": "faq_002",
        "topicId": "payments",
        "question": "How can I know the status or validity of my package?",
        "answer": "You can check your package status by going to 'My Packages' section in your dashboard. All active and expired packages will be displayed with their validity dates."
      },
      {
        "id": "faq_003",
        "topicId": "property_listings",
        "question": "When will my Property become visible on the site?",
        "answer": "Properties go through a verification process that takes up to 24 hours. Once approved, your property will be visible immediately on the site."
      }
    ]
  }
}
```

### 2. Submit Support Ticket
Allows users to submit a support request.

*   **Method:** `POST`
*   **Path:** `{{baseUrl}}/support/ticket`
*   **Request Body JSON:**
```json
{
  "subject": "User Inquiry from App Help Section",
  "message": "User needs assistance with billing packages.",

#### Get All FAQs (Admin)
`GET {{baseUrl}}/support/admin/faqs`

#### Create FAQ (Admin)
`POST {{baseUrl}}/support/admin/faqs`

**Body:**
```json
{
  "topicId": "user_profile",
  "question": "How can I de-activate my account?",
  "answer": "To deactivate your RealEstate account, please login to your profile settings and select the 'Deactivate Account' option. Your data will be preserved for 30 days."
}
```

#### Update FAQ (Admin)
`PATCH {{baseUrl}}/support/admin/faqs/{{faqId}}`

**Body:**
```json
{
  "question": "Updated question?",
  "answer": "Updated answer."
}
```

#### Delete FAQ (Admin)
`DELETE {{baseUrl}}/support/admin/faqs/{{faqId}}`

---

## Quick Postman Test Flow

1. `POST /auth/register`
2. Copy returned `otp`.
3. `POST /auth/verify-register-otp`
4. Save returned `token` using the test script.
5. For broker/channel_partner users, register agent profile with `POST /agents/register`.
6. Get nearby agents with `GET /agents/around-me/{{location}}`.
7. Create master data:
   - `POST /amenities`
   - `POST /furniture`
   - `POST /nearby-places`
   - `POST /positive-keywords`
   - `POST /negative-keywords`
6. `POST /properties` using form-data.
7. `POST /requirements` to share what you need.
8. `GET /requirements/{{requirementId}}/matches` to see properties matching the requirement.
9. `POST /reviews`.
10. `GET /reviews/property/{{propertyId}}/summary`.
11. `POST /shortlist`, then `GET /shortlist/my`.
12. `GET /user-home`.
13. `POST /auth/logout`.

## Frontend Notes

- Treat all `*_id` fields as MongoDB ObjectId strings.
- Property create/update should use `multipart/form-data`, not JSON, when files are included.
- For array fields in property form-data, send JSON strings:

```txt
amenityIds = ["64f000000000000000000001"]
furnishings = [{"furnishingId":"64f000000000000000000002","quantity":1}]
nearbyPlaces = [{"nearbyId":"64f000000000000000000003","distance":1.2,"distanceUnit":"km"}]
```

- Public read APIs exist for master data, keywords, reviews, review summary, and public user status.
- Property list/detail are currently protected, so frontend must call them after login.
- Deletions are soft deletes using `deletedAt`.

---

## Inquiry APIs

All inquiry endpoints require auth (`Authorization: Bearer {{token}}`).

**Base path:** `{{baseUrl}}/inquiries`

---

### 1. Submit Inquiry

User submits an inquiry on a property. After submission, the response includes the full property detail and the contact person (dealer if assigned, otherwise owner) so the frontend can show who to reach.

`POST {{baseUrl}}/inquiries`

Headers: auth required.

Body (JSON):

```json
{
  "username": "Rahul Sharma",
  "phoneNumber": "9876543210",
  "property_id": "{{propertyId}}",
  "isAgent": "No"
}
```

**Field rules:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `username` | string | ✅ | Non-empty string |
| `phoneNumber` | string | ✅ | 10 digits, must start with 6–9 |
| `property_id` | string | ✅ | Valid MongoDB ObjectId of an existing, non-deleted property |
| `isAgent` | string | ❌ | "Yes" or "No" (defaults to "No") |

**Duplicate prevention:** If the user has already submitted an open (`status: true`) inquiry for the same property, a `409 Conflict` is returned.

**Success Response `201 Created`:**

```json
{
  "success": true,
  "message": "Inquiry submitted successfully",
  "data": {
    "inquiry": {
      "_id": "664f000000000000000000a1",
      "username": "Rahul Sharma",
      "phoneNumber": "9876543210",
      "isAgent": "No",
      "status": true,
      "property_id": "664f000000000000000000b1",
      "createdAt": "2026-05-26T10:00:00.000Z"
    },
    "contactPerson": {
      "_id": "664f000000000000000000c1",
      "name": "Amit Broker",
      "email": "amit@example.com",
      "phone": "9123456789",
      "role": "broker"
    },
    "property": {
      "_id": "664f000000000000000000b1",
      "title": "3 BHK Apartment in Satellite",
      "propertyName": "Green Valley Apartment",
      "propertyType": "Apartment",
      "propertyCategory": "Residential",
      "listingType": "Sale",
      "price": 7500000,
      "priceUnit": "total",
      "area": 1500,
      "measureType": "sqft",
      "bedrooms": 3,
      "bathrooms": 2,
      "city": "Ahmedabad",
      "state": "Gujarat",
      "address": "Block A, Green Valley, Satellite",
      "status": "Active",
      "media": [
        {
          "fileName": "property-img-1.jpg",
          "type": "image",
          "uploadedAt": "2026-05-01T08:00:00.000Z",
          "url": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
        }
      ],
      "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg",
      "ownerId": { "_id": "...", "name": "...", "email": "...", "phone": "...", "role": "user" },
      "dealerId": { "_id": "...", "name": "Amit Broker", "email": "amit@example.com", "phone": "9123456789", "role": "broker" },
      "amenityIds": [{ "_id": "...", "amenityName": "Swimming Pool" }],
      "furnishings": [{ "furnishingId": { "_id": "...", "furnitureName": "Sofa", "quantity": 1 } }],
      "nearbyPlaces": [{ "nearbyId": { "_id": "...", "placeName": "Metro Station", "distance": 0.5, "distanceUnit": "km" } }],
      "createdAt": "2026-05-01T08:00:00.000Z"
    }
  }
}
```

**Error cases:**

| Status | Reason |
|---|---|
| `400 Bad Request` | Missing or invalid `username`, `phoneNumber`, or `property_id` |
| `404 Not Found` | Property not found or soft-deleted |
| `409 Conflict` | User already has an open inquiry for this property |

Postman test script:

```js
const json = pm.response.json();
if (json.data && json.data.inquiry && json.data.inquiry._id) {
  pm.environment.set("inquiryId", json.data.inquiry._id);
}
```

---

### 2. Get Received Inquiries (Owner / Dealer View)

Returns all inquiries submitted on the logged-in user's properties. Each item includes the **user who inquired** and the **full property detail** with media URLs.

`GET {{baseUrl}}/inquiries/received`

Headers: auth required.

Optional query params:

```txt
page  = 1
limit = 10
```

**Success Response `200 OK`:**

```json
{
  "success": true,
  "message": "Received inquiries fetched successfully",
  "data": [
    {
      "_id": "664f000000000000000000a1",
      "username": "Rahul Sharma",
      "phoneNumber": "9876543210",
      "status": true,
      "createdAt": "2026-05-26T10:00:00.000Z",
      "userDetail": {
        "_id": "664f000000000000000000d1",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "role": "user"
      },
      "property": {
        "_id": "664f000000000000000000b1",
        "title": "3 BHK Apartment in Satellite",
        "propertyName": "Green Valley Apartment",
        "propertyType": "Apartment",
        "propertyCategory": "Residential",
        "listingType": "Sale",
        "price": 7500000,
        "city": "Ahmedabad",
        "state": "Gujarat",
        "address": "Block A, Green Valley, Satellite",
        "status": "Active",
        "media": [
          {
            "fileName": "property-img-1.jpg",
            "type": "image",
            "uploadedAt": "2026-05-01T08:00:00.000Z",
            "url": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
          }
        ],
        "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg",
        "amenityIds": [{ "_id": "...", "amenityName": "Gym" }],
        "createdAt": "2026-05-01T08:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

> If the user has no properties listed, returns `data: []` immediately without a DB scan.

```

### 3. Check Inquiry Status

Check if the current user has already submitted an active inquiry for a specific property.

`GET {{baseUrl}}/inquiries/status/{{propertyId}}`

Headers: auth required.

**Success Response `200 OK`:**

```json
{
  "success": true,
  "message": "Inquiry status fetched successfully",
  "data": {
    "propertyId": "664f000000000000000000b1",
    "isInquired": true
  }
}
```


### 4. My Contacts (User — Inquiries I Submitted)

Returns all properties the logged-in user has submitted inquiries for, with full property details and media URLs.

`GET {{baseUrl}}/inquiries/mycontacts`

Headers: auth required.

Optional query params:

```txt
page  = 1
limit = 10
```


**Success Response `200 OK`:**

```json
{
  "success": true,
  "message": "Your inquiries fetched successfully",
  "data": [
    {
      "_id": "664f000000000000000000a1",
      "username": "Rahul Sharma",
      "phoneNumber": "9876543210",
      "status": true,
      "createdAt": "2026-05-26T10:00:00.000Z",
      "property": {
        "_id": "664f000000000000000000b1",
        "title": "3 BHK Apartment in Satellite",
        "propertyName": "Green Valley Apartment",
        "propertyType": "Apartment",
        "propertyCategory": "Residential",
        "listingType": "Sale",
        "price": 7500000,
        "city": "Ahmedabad",
        "state": "Gujarat",
        "address": "Block A, Green Valley, Satellite",
        "status": "Active",
        "media": [
          {
            "fileName": "property-img-1.jpg",
            "type": "image",
            "uploadedAt": "2026-05-01T08:00:00.000Z",
            "url": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
          }
        ],
        "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg",
        "ownerId": { "_id": "...", "name": "Owner Name", "email": "owner@example.com", "phone": "9000000001", "role": "user" },
        "dealerId": { "_id": "...", "name": "Amit Broker", "email": "amit@example.com", "phone": "9123456789", "role": "broker" },
        "amenityIds": [{ "_id": "...", "amenityName": "Swimming Pool" }],
        "furnishings": [{ "furnishingId": { "_id": "...", "furnitureName": "Sofa", "quantity": 1 } }],
        "nearbyPlaces": [{ "nearbyId": { "_id": "...", "placeName": "Metro Station", "distance": 0.5, "distanceUnit": "km" } }],
        "createdAt": "2026-05-01T08:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### Inquiry Schema Reference

| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `userId` | ObjectId (ref: User) | Logged-in user who submitted |
| `property_id` | ObjectId (ref: Property) | Target property |
| `username` | String | Contact name provided by user |
| `phoneNumber` | String | 10-digit phone starting with 6–9 |
| `isAgent` | String | "Yes" or "No" |
| `status` | Boolean | `true` = open, `false` = resolved/closed |
| `createdAt` | Date | Submission timestamp |
| `updatedAt` | Date | Last update timestamp |
| `deletedAt` | Date | Soft delete marker (null = active) |
---

## Admin APIs

All admin routes require a valid JWT token representing a user with the `admin` role.

### 1. Get All Users (Admin View)
Returns a list of all registered users on the platform excluding admin users.

`GET {{baseUrl}}/admin/users`

Headers: Auth required. Admin access only.

Optional query params:
```txt
page   = 1
limit  = 10
search = Rahul (searches by name, phone, or email)
role   = broker (user, broker, channel_partner, builder)
```

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "_id": "664f000000000000000000c1",
      "name": "Amit Broker",
      "role": "broker",
      "agencyName": "Prime Realty",
      "phone": "9123456789",
      "email": "amit@example.com",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "documents": [],
      "isVerified": true,
      "profileImageUrl": null,
      "documentUrls": []
    }
  ]
}
```

---

### 2. Get User Detail (Admin View)
Returns full details of a specific user, along with a list of properties they own or deal, and a count of those properties grouped by status.

`GET {{baseUrl}}/admin/users/{{userId}}`

Headers: Auth required. Admin access only.

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "User detail fetched successfully",
  "data": {
    "user": {
      "_id": "664f000000000000000000c1",
      "name": "Amit Broker",
      "role": "broker",
      "agencyName": "Prime Realty",
      "phone": "9123456789",
      "email": "amit@example.com",
      "city": "Ahmedabad",
      "state": "Gujarat",
      "profileImageUrl": null,
      "documentUrls": []
    },
    "propertySummary": {
      "total": 1,
      "byStatus": {
        "Active": 1
      }
    },
    "properties": [
      {
        "_id": "664f000000000000000000b1",
        "title": "3 BHK Apartment in Satellite",
        "propertyName": "Green Valley Apartment",
        "propertyType": "Apartment",
        "propertyCategory": "Residential",
        "listingType": "Sale",
        "price": 7500000,
        "priceUnit": "total",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "status": "Active",
        "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg",
        "media": [
          {
            "fileName": "property-img-1.jpg",
            "type": "image",
            "url": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
          }
        ]
      }
    ]
  }
}
```

---

### 3. Get All Properties (Admin View)
Returns all properties across all users on the platform.

`GET {{baseUrl}}/admin/properties`

Headers: Auth required. Admin access only.

Optional query params:
```txt
page             = 1
limit            = 10
search           = Satellite (searches by title, city, or locality)
status           = Active
listingType      = Sale
propertyCategory = Residential
```

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Properties fetched successfully",
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "_id": "664f000000000000000000b1",
      "title": "3 BHK Apartment in Satellite",
      "propertyName": "Green Valley Apartment",
      "propertyCategory": "Residential",
      "propertyType": "Apartment",
      "listingType": "Sale",
      "city": "Ahmedabad",
      "locality": "Satellite",
      "price": 7500000,
      "priceUnit": "total",
      "status": "Active",
      "ownerId": {
        "_id": "664f000000000000000000d1",
        "name": "Rahul Sharma",
        "phone": "9876543210",
        "role": "user"
      },
      "dealerId": null,
      "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
    }
  ]
}
```

---

### 4. Get Requirements (Admin View)
Returns a list of all active requirements in the platform, populated with basic user details, along with a count of active properties matching each requirement.

`GET {{baseUrl}}/admin/requirements`

Headers: Auth required. Admin access only.

Optional query params:
```txt
page            = 1
limit           = 10
search          = Satellite (searches by location list)
status          = Active
transactionType = Buy
```

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Requirements fetched successfully",
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "_id": "664f000000000000000000e1",
      "userId": {
        "_id": "664f000000000000000000d1",
        "name": "Rahul Sharma",
        "phone": "9876543210",
        "role": "user",
        "city": "Ahmedabad",
        "state": "Gujarat"
      },
      "transactionType": "Buy",
      "locations": ["Satellite"],
      "propertyTypes": ["Apartment"],
      "minBudget": 5000000,
      "maxBudget": 8000000,
      "minArea": 1000,
      "maxArea": 1800,
      "status": "Active",
      "matchedPropertyCount": 5
    }
  ]
}
```

---

### 5. Get Requirement Detail (Admin View)
Returns full details of a specific requirement, along with up to 5 loosely-matched properties.

`GET {{baseUrl}}/admin/requirements/{{requirementId}}`

Headers: Auth required. Admin access only.

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Requirement fetched successfully",
  "data": {
    "requirement": {
      "_id": "664f000000000000000000e1",
      "userId": {
        "_id": "664f000000000000000000d1",
        "name": "Rahul Sharma",
        "phone": "9876543210",
        "role": "user",
        "city": "Ahmedabad",
        "state": "Gujarat"
      },
      "transactionType": "Buy",
      "locations": ["Satellite"],
      "propertyTypes": ["Apartment"],
      "minBudget": 5000000,
      "maxBudget": 8000000,
      "minArea": 1000,
      "maxArea": 1800,
      "status": "Active"
    },
    "matchedProperties": [
      {
        "_id": "664f000000000000000000b1",
        "title": "3 BHK Apartment in Satellite",
        "propertyName": "Green Valley Apartment",
        "propertyType": "Apartment",
        "propertyCategory": "Residential",
        "listingType": "Sale",
        "price": 7500000,
        "priceUnit": "total",
        "city": "Ahmedabad",
        "locality": "Satellite",
        "status": "Active",
        "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
      }
    ]
  }
}
```

---

### 6. Get All Inquiries (Admin View)
Returns a list of all inquiries across the platform with user and property details.

`GET {{baseUrl}}/admin/inquiries`

Headers: Auth required. Admin access only.

Optional query params:
```txt
page    = 1
limit   = 10
search  = Rahul (searches by inquirer username or phone)
status  = true (true for open, false for closed)
isAgent = Yes (Yes or No)
```

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Inquiries fetched successfully",
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "_id": "664f000000000000000000a1",
      "userId": {
        "_id": "664f000000000000000000d1",
        "name": "Rahul Sharma",
        "phone": "9876543210",
        "role": "user"
      },
      "property_id": {
        "_id": "664f000000000000000000b1",
        "title": "3 BHK Apartment in Satellite",
        "propertyName": "Green Valley Apartment",
        "propertyType": "Apartment",
        "propertyCategory": "Residential",
        "listingType": "Sale",
        "price": 7500000,
        "priceUnit": "total",
        "city": "Ahmedabad",
        "locality": "Satellite",
        "status": "Active",
        "ownerId": {
          "_id": "664f000000000000000000d1",
          "name": "Rahul Sharma",
          "phone": "9876543210",
          "role": "user"
        },
        "dealerId": null,
        "coverImage": "https://ik.imagekit.io/aj6cyp5nm/properties/images/property-img-1.jpg"
      },
      "username": "Rahul Sharma",
      "phoneNumber": "9876543210",
      "isAgent": "No",
      "status": true,
      "createdAt": "2026-05-26T10:00:00.000Z"
    }
  ]
}

### 7. Get All Property Documents (Admin View)

Returns all property documents uploaded by users, recursively populated with detailed property info, and owner/dealer details.

`GET {{baseUrl}}/admin/property-docs`

Headers: Auth required. Admin access only.

Optional query params:
```txt
page         = 1
limit        = 10
status       = Pending (Pending, Approved, or Rejected)
documentType = Floor Plan (Ownership Proof, Agreement, Floor Plan, Brochure, etc.)
search       = Rahul (searches across document title, property title/name, user name, email, or phone)
```

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Admin property documents fetched successfully",
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "data": [
    {
      "_id": "6a19246d183b54c9357d78c0",
      "propertyId": {
        "_id": "664f000000000000000000b1",
        "title": "3 BHK Apartment in Satellite",
        "propertyName": "Green Valley Apartment",
        "ownerId": {
          "_id": "664f000000000000000000d1",
          "name": "Rahul Sharma",
          "phone": "9876543210",
          "email": "rahul@example.com",
          "role": "user"
        },
        "dealerId": null
      },
      "documentType": "Floor Plan",
      "title": "Verified Floor Plan Draft",
      "fileName": "property-doc-floorplan.pdf",
      "fileSize": 120485,
      "status": "Pending",
      "createdAt": "2026-05-29T10:00:00.000Z",
      "updatedAt": "2026-05-29T10:00:00.000Z",
      "fileUrl": "https://ik.imagekit.io/aj6cyp5nm/properties/documents/property-doc-floorplan.pdf"
    }
  ]
}
```

---

### 8. Update Property Document Status (Admin View)

Updates verification status of a property document, which triggers Socket.io and DB notifications to the property owner/dealer.

`PATCH {{baseUrl}}/admin/property-docs/:id/status`

Headers: Auth required. Admin access only.

Body (JSON):
```json
{
  "status": "Approved"
}
```

**Field rules:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `status` | string | ✅ | "Pending", "Approved", or "Rejected" |

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Property document status updated to Approved",
  "data": {
    "_id": "6a19246d183b54c9357d78c0",
    "status": "Approved",
    "updatedAt": "2026-05-29T11:40:00.000Z"
  }
}
```

---

## Notification & Socket.io APIs

Exposes HTTP API endpoints for managing notification logs and Socket.io specifications for real-time channels.

### HTTP REST APIs

All endpoints require valid JWT authentication (`Authorization: Bearer {{token}}`).

**Base Path:** `{{baseUrl}}/notifications`

#### 1. Get My Notifications
Retrieves historical notifications targeting the logged-in user, paginated. If the logged-in user has the `admin` role, the response also includes system-wide and admin-targeted notifications.

*   **Method:** `GET`
*   **Path:** `{{baseUrl}}/notifications`
*   **Query Parameters:**
    *   `page` (number, optional, default: 1)
    *   `limit` (number, optional, default: 10)

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [
      {
        "_id": "6a19246d183b54c9357d78c0",
        "senderId": {
          "_id": "6a0ea275e194ff9a92e423e5",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "recipientId": "6a0ea275e194ff9a92e423e6",
        "recipientType": "user",
        "title": "Property Document Status: Approved",
        "message": "Your document \"Floor Plan\" for property \"Premium Lakeview Villa\" has been approved.",
        "type": "property_approval",
        "relatedId": "6a19246d183b54c9357d78bf",
        "relatedModel": "PropertyDocument",
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-05-29T10:55:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "pages": 1
    },
    "unreadCount": 1
  }
}
```

#### 2. Mark Single Notification As Read
Marks a specific notification as read.

*   **Method:** `PUT`
*   **Path:** `{{baseUrl}}/notifications/:id/read`

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Notification marked as read successfully",
  "data": {
    "_id": "6a19246d183b54c9357d78c0",
    "isRead": true,
    "readAt": "2026-05-29T11:00:00.000Z",
    "title": "Property Document Status: Approved",
    "message": "Your document \"Floor Plan\" for property \"Premium Lakeview Villa\" has been approved.",
    "type": "property_approval"
  }
}
```

#### 3. Mark All Notifications As Read
Marks all notifications for the authenticated user as read.

*   **Method:** `PUT`
*   **Path:** `{{baseUrl}}/notifications/mark-all-read`

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "All notifications marked as read successfully"
}
```

#### 4. Delete Notification
Soft deletes a specific notification.

*   **Method:** `DELETE`
*   **Path:** `{{baseUrl}}/notifications/:id`

**Success Response `200 OK`:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### Real-Time Socket.io Connection & Flow

#### 1. Establishing Connection
To connect, client libraries should pass the JWT token in `auth` handshake configurations or `query` parameters.

```javascript
const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_ACCESS_TOKEN"
  }
});
```

#### 2. Client Room Routing (Auto-Joined)
When a client successfully authenticates and connects, the backend automatically joins them to target rooms:
- **Individual Room**: `user_{{userId}}` AND the raw `{{userId}}` (For direct, user-specific notifications)
- **Admin Room**: `admins` (Only joined if the user's role is `admin`, receives general admin alerts)

The backend also handles standard custom register/join/login subscription events emitted from client-side controllers (e.g., Flutter) dynamically.

#### 3. Real-Time Events
- **Event Name**: `notification`
- **Emitted Data Format**:
```json
{
  "id": "6a19246d183b54c9357d78c0",
  "senderId": "6a0ea275e194ff9a92e423e5",
  "recipientId": "6a0ea275e194ff9a92e423e6",
  "recipientType": "user",
  "title": "New Property Inquiry Received",
  "message": "Rahul Sharma submitted an inquiry for your property \"Luxury Penthouse\".",
  "type": "inquiry",
  "relatedId": "6a19246e183b54c9357d78a9",
  "relatedModel": "Inquiry",
  "isRead": false,
  "createdAt": "2026-05-29T10:58:00.000Z"
}
```

---

### Professional Matching Inquiry Notification Flow

When a user submits a new inquiry on a property, the backend dynamically captures the property's `city` and `city_area` and stores them in the persistent `Inquiry` model. It then distributes matching notifications to registered real-estate professionals based on their locations:

1. **Brokers**:
   - **Matching Rules**: Must match BOTH `city` (exact case-insensitive match on the `User` document) **AND** the property's `city_area` must match one of the broker's registered active expert areas inside `ExpertInArea` (`models/expertInArea.model.js`).
   
2. **Channel Partners & Builders**:
   - **Matching Rules**: Must match `city` (exact case-insensitive match on the `User` document) alone.

3. **Exclusions**:
   - The buyer submitting the inquiry and the direct owner/dealer of the property are automatically filtered out of the broadcast to prevent duplicate or irrelevant alerts.

#### Expert In Area Updates
- **Ownership**: `models/expertInArea.model.js` includes `userId` pointing to the `User` model, recording who registered the area.
- **GET Profile integration**: The `GET /api/users/profile` (`controllers/user.controller.js`) endpoint now dynamically returns the logged-in user's list of registered active expert areas:
```json
{
  "success": true,
  "data": {
    "id": "6a0ea275e194ff9a92e423e6",
    "name": "Amit Patel",
    "role": "broker",
    "city": "Ahmedabad",
    "expertInAreas": ["Satellite", "Prahlad Nagar", "Bodakdev"],
    "stats": {
      "shortlisted": 3,
      "contacted": 12,
      "propertyViewed": 45
    }
  }
}
```

---

### Professional Matching Requirement Notification Flow

When a user submits a new property **requirement** (via `POST /api/requirements`), the backend applies a role-based matching algorithm to decide which registered professionals receive a real-time notification. Notifications are **not** broadcast globally — only qualified recipients who serve the relevant area receive them.

#### Matching Rules

| Role | Matching Condition |
|:---|:---|
| `broker` | User's `city` matches one of the requirement's `locations` **AND** the user has an active `ExpertInArea` record whose `areaName` matches the requirement's `area` |
| `channel_partner` | User's `city` matches one of the requirement's `locations` (city match only) |
| `builder` | User's `city` matches one of the requirement's `locations` (city match only) |
| `admin` | Always notified (regardless of location) |

> **Note:** If the requirement has **no `area`** set, brokers are qualified by **city match alone** (same rule as channel_partner/builder).

#### Flow Steps

1. Requirement is created and saved to the database.
2. The backend normalizes `requirement.locations` (array of cities) and `requirement.area`.
3. All professional users (roles: `broker`, `channel_partner`, `builder`, `admin`) excluding the submitter are fetched with their `city` field.
4. **Broker filtering (2-step)**:
   - Step 1: Filter brokers whose `city` matches any of the requirement's locations.
   - Step 2: Query `ExpertInArea` for those broker IDs — only keep brokers with at least one active `areaName` matching `requirement.area` (case-insensitive regex).
5. **Channel partner / Builder filtering**: Filter by `city` match only.
6. **Admins**: Always included.
7. `Notification` documents are batch-inserted for all qualified recipients.
8. A real-time socket event (`notification`) is emitted via `sendToUsers()` to all qualified recipient IDs.

#### Requirement Model Fields (relevant to matching)

```json
{
  "locations": ["Ahmedabad", "Surat"],
  "area": "Satellite"
}
```

- `locations` → array of cities the buyer is looking in.
- `area` → specific sub-area/locality within those cities.

#### Example Scenarios

**Scenario A**: Requirement submitted for `locations: ["Ahmedabad"]`, `area: "Satellite"`
- Broker in Ahmedabad with ExpertInArea `"Satellite"` → ✅ Notified
- Broker in Ahmedabad with ExpertInArea `"Prahlad Nagar"` → ❌ Not notified (area mismatch)
- Broker in Surat → ❌ Not notified (city mismatch)
- Channel partner in Ahmedabad → ✅ Notified (city match only)
- Builder in Ahmedabad → ✅ Notified (city match only)
- Admin → ✅ Always notified

**Scenario B**: Requirement submitted for `locations: ["Ahmedabad"]`, no `area`
- Broker in Ahmedabad (any expert area) → ✅ Notified (no area filter applied)
- Channel partner in Ahmedabad → ✅ Notified
- All other cities → ❌ Not notified

---

## Bank APIs

CRUD endpoints to manage banks. Creating, updating, and deleting bank records require admin authentication.

### Create Bank (Admin Only)

`POST {{baseUrl}}/banks`

Headers:
- `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`
- `Content-Type: multipart/form-data`

Body (Form Data):
- `bankName` (string, required): Name of the bank.
- `interest` (number, required): Interest rate percentage (e.g. 8.5).
- `about` (string, optional): Short description about the bank.
- `bankIcon` (file, optional): Bank logo/icon image (`jpg`, `jpeg`, `png`, `webp` max 5 MB).

Response Example (`201 Created`):
```json
{
  "success": true,
  "message": "Bank created successfully",
  "data": {
    "_id": "6a214d0f62bbf5a9e320d301",
    "bankName": "HDFC Bank",
    "interest": 8.5,
    "about": "Premier housing loan provider.",
    "bankIcon": "1716982462000-hdfc.png",
    "bankIconUrl": "https://ik.imagekit.io/aj6cyp5nm/banks/icons/1716982462000-hdfc.png",
    "createdAt": "2026-05-29T12:00:00.000Z",
    "updatedAt": "2026-05-29T12:00:00.000Z",
    "deletedAt": null
  }
}
```

### Get All Banks

Fetches a list of all active banks.

`GET {{baseUrl}}/banks`

Optional query params:
- `search` (string): Filter banks by name.
- `page` (number): Page number for pagination.
- `limit` (number): Number of banks per page.

Response Example (`200 OK`):
```json
{
  "success": true,
  "message": "Banks fetched successfully",
  "data": [
    {
      "_id": "6a214d0f62bbf5a9e320d301",
      "bankName": "HDFC Bank",
      "interest": 8.5,
      "about": "Premier housing loan provider.",
      "bankIcon": "1716982462000-hdfc.png",
      "bankIconUrl": "https://ik.imagekit.io/aj6cyp5nm/banks/icons/1716982462000-hdfc.png",
      "createdAt": "2026-05-29T12:00:00.000Z",
      "updatedAt": "2026-05-29T12:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "totalBanks": 1
  }
}
```

### Get Bank By ID

`GET {{baseUrl}}/banks/:id`

### Update Bank (Admin Only)

`PUT {{baseUrl}}/banks/:id`

Headers:
- `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`
- `Content-Type: multipart/form-data`

Body (Form Data) - any optional fields:
- `bankName` (string)
- `interest` (number)
- `about` (string)
- `bankIcon` (file)

### Delete Bank (Admin Only)

Soft deletes a bank.

`DELETE {{baseUrl}}/banks/:id`

Headers:
- `Authorization: Bearer <ADMIN_ACCESS_TOKEN>`

---

## Property Integration with Banks

All active banks and their interest rates are automatically returned when querying property information:
1. **Property List GET API (`GET /properties`)**: Returns a `banks` array at the top level of the JSON response.
2. **Property Detail GET API (`GET /properties/:id`)**: Returns a `banks` array directly nested inside the property's `data` object.

