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

Broker/dealer/builder must include `agencyName`:

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

Allowed roles: `user`, `broker`, `dealer`, `builder`, `admin`.

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

Headers: auth required.

Optional query params: `page`, `limit`, `isAdmin`, `isLogin`, `userId`, `deviceType`, `search`.

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
```

File fields:

```txt
images = select image file, max 5
videos = select one video file, max 1
```

Allowed image types: `jpg`, `jpeg`, `png`, `webp`.
Allowed video types: `mp4`, `mpeg`, `mov`, `avi`.
Max image size: 5 MB per file.
Max video size: 50 MB.
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

Returns paginated property cards/list data.

`GET {{baseUrl}}/properties?page=1&limit=10&city=Ahmedabad&listingType=Sale&sortBy=newest`

Headers: auth required.

Optional filters:

```txt
search
status
city
city_area
state
locality
listingType
propertyCategory
propertyType
bhk
bedrooms
bathrooms
minPrice
maxPrice
minArea
maxArea
facing
furnishingIds
amenityIds
nearbyIds
ownerId
dealerId
sortBy
page
limit
```

`sortBy` values: `price_asc`, `price_desc`, `oldest`, `newest`.

For multi-value IDs, send comma-separated values:

```txt
amenityIds=ID1,ID2
nearbyIds=ID1,ID2
furnishingIds=ID1,ID2
```

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

### Get Property By ID

Returns full property details with populated owner/dealer/amenities/media URLs.

`GET {{baseUrl}}/properties/{{propertyId}}`

Headers: auth required.

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
parking = true
amenityIds = ["{{amenityId}}"]
furnishings = [{"furnishingId":"{{furnitureId}}","quantity":1}]
nearbyPlaces = [{"nearbyId":"{{nearbyPlaceId}}","distance":1,"distanceUnit":"km"}]
images = select new image file
videos = select new video file
```

Note: uploaded images are appended to existing images. Uploaded video replaces the existing video because only one video is allowed per property.

### Delete Property

Soft deletes a property.

`DELETE {{baseUrl}}/properties/{{propertyId}}`

Headers: auth required.

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
status = Active
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

Allowed `status`: `Active`, `Inactive`.

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

### Get Property Document By ID

`GET {{baseUrl}}/property-documents/{{documentId}}`

Headers: auth required.

### Update Property Document

`PUT {{baseUrl}}/property-documents/{{documentId}}`

Headers: auth required.

Body type: `form-data`

```txt
title = Updated Sale Deed
status = Active
documentType = Agreement
document = select optional replacement file
```

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

Registers the logged-in user as an agent. Only users with role `broker` or `dealer` can register as an agent.

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

If the logged-in user role is not `broker` or `dealer`, API returns forbidden:

```json
{
  "success": false,
  "message": "Only broker and dealer users can register as agents"
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

Returns a list of requirements submitted by the logged-in user.

`GET {{baseUrl}}/requirements/my`

### Get All Requirements (Lead Discovery for Agents)

Allows agents to discover buyer/renter leads.

`GET {{baseUrl}}/requirements/all?city=Ahmedabad&transactionType=Buy&page=1&limit=10`

**Constraint:** Only accessible by users with roles `broker`, `dealer`, `builder`, or `admin`.

Optional Query Params: `transactionType`, `city`, `minBudget`, `maxBudget`, `page`, `limit`.

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

### Delete Requirement

`DELETE {{baseUrl}}/requirements/{{requirementId}}`

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

---

## Quick Postman Test Flow

1. `POST /auth/register`
2. Copy returned `otp`.
3. `POST /auth/verify-register-otp`
4. Save returned `token` using the test script.
5. For broker/dealer users, register agent profile with `POST /agents/register`.
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
