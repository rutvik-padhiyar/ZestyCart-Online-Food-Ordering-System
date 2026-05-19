# Data Dictionary

This document defines the database collections and key fields used in the food ordering system backend.

## Common Conventions

| Item | Description |
| --- | --- |
| `_id` | MongoDB ObjectId primary key on every document |
| `createdAt`, `updatedAt` | Auto-managed when schema uses timestamps |
| GeoJSON Point | Structure: `{ type: "Point", coordinates: [lng, lat] }` |

## User (`User`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | No | Optional during OTP stage |
| mobile | String | No | `unique`, `sparse` |
| email | String | Yes | `unique`, lowercase |
| password | String | No | Password hash storage |
| role | String | No | Enum: `user`, `customer`, `restaurant`, `partner`, `admin`, `delivery` (default `user`) |
| isAdmin | Boolean | No | Default `false` |
| isActive | Boolean | No | Default `true` |
| otpVerified | Boolean | No | Default `false` |
| otp | String | No | OTP value |
| otpExpiresAt | Date | No | OTP expiry |
| address | String | No | Profile address |
| profileImage | String | No | Profile image URL/path |
| isBlocked | Boolean | No | Default `false` |
| vehicleType | String | No | Enum: `bike`, `cycle`, `scooter`, `car` |
| availability | String | No | Enum: `free`, `busy` (default `free`) |
| location.type | String | No | Geo type, default `Point` |
| location.coordinates | Number[] | No | `[lng, lat]`, default `[0,0]` |
| twoFactorSecret | String | No | 2FA secret |
| twoFactorEnabled | Boolean | No | Default `false` |
| createdAt | Date | No | Default now |

Indexes:
- `location` as `2dsphere`

## Restaurant (`Restaurant`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes | Restaurant name |
| ownerName | String | Yes | Owner name |
| mobile | String | Yes | Contact number |
| email | String | Yes | Contact email |
| city | String | No | Default empty |
| state | String | No | Default empty |
| address | String | No | Default empty |
| shortDescription | String | No | Short intro |
| description | String | No | Long intro |
| cuisines | String[] | No | Default `[]` |
| tags | String[] | No | Search tags |
| features | String[] | No | Features list |
| galleryImages | String[] | No | Image URLs |
| rating | Number | No | Default `4.6` |
| deliveryTime | String | No | Default `30-40 mins` |
| priceRange | String | No | Default `Premium Casual` |
| avgCostForTwo | Number | No | Default `1200` |
| openingHours | String | No | Default `11:00 AM - 11:30 PM` |
| panCardImage | String | Yes | Default placeholder image |
| restaurantImage | String | Yes | Default placeholder image |
| fssaiLicense | String | No | License value/path |
| bankDetails.accountNumber | String | No | Bank details |
| bankDetails.ifsc | String | No | Bank IFSC |
| bankDetails.bankName | String | No | Bank name |
| location.type | String | No | Geo type, default `Point` |
| location.coordinates | Number[] | Yes | `[lng, lat]` |
| isBlocked | Boolean | No | Default `false` |

Indexes:
- `location` as `2dsphere`

## Food (`Food`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes | Item name |
| description | String | No | Item details |
| price | Number | Yes | Selling price |
| image | String | No | Image URL/path |
| category | String | No | Food category |
| address | String | No | Display address |
| rating | String | No | Rating text |
| deliveryTime | String | No | ETA text |
| prepTimeMinutes | Number | No | Default `12` |
| stockQuantity | Number | No | Default `50` |
| lowStockThreshold | Number | No | Default `5` |
| inventoryAlertEnabled | Boolean | No | Default `true` |
| ingredients | String[] | No | Default `[]` |
| restaurant | ObjectId | No | Ref `Restaurant` |
| user | ObjectId | No | Ref `User` |

## Product (`Product`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| restaurantId | ObjectId | No | Ref `Restaurant` |
| name | String | Yes | Product title |
| description | String | No | Default empty |
| price | Number | Yes | Min 0 |
| image | String | No | Media URL/path |
| address | String | No | Default empty |
| category | String | Yes | Example: cold drinks, street food |
| deliveryTime | String | No | Default `30-45 min` |
| isAvailable | Boolean | No | Default `true` |
| createdAt | Date | No | Default now |

## Cart (`Cart`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| user | ObjectId | Yes | Ref `User` |
| items | Array | No | Cart line items |
| items.product | ObjectId | Yes | Ref `Food` |
| items.quantity | Number | Yes | Default `1` |

## Order (`Order`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| user | ObjectId | Yes | Ref `User` |
| restaurant | ObjectId | Yes | Ref `Restaurant` |
| items | Array | No | Items with food references |
| items.food | ObjectId | No | Ref `Food` |
| items.quantity | Number | Yes | Default `1` |
| foodItems | Array | No | Snapshot fields: `name`, `price`, `quantity` |
| totalPrice | Number | Yes | Total payable |
| paymentMethod | String | No | Enum: `COD`, `Online` |
| paymentStatus | String | No | Enum: `pending`, `paid`, `failed`, `refunded` |
| emergency | Boolean | No | Default `false` |
| address | String | Yes | Delivery address |
| mobile | String | Yes | Delivery contact |
| location.type | String | No | Geo type `Point` |
| location.coordinates | Number[] | Yes | Delivery coordinates |
| status | String | No | Enum: `placed`, `confirmed`, `rejected`, `assigned`, `picked`, `on-the-way`, `delivered` |
| restaurantStatus | String | No | Enum: `new`, `accepted`, `preparing`, `ready`, `rejected` |
| restaurantAcceptedAt | Date | No | Workflow timestamp |
| preparationStartedAt | Date | No | Workflow timestamp |
| readyForPickupAt | Date | No | Workflow timestamp |
| assignedDeliveryAt | Date | No | Workflow timestamp |
| estimatedPrepMinutes | Number | No | Default `15` |
| priorityScore | Number | No | Default `0` |
| routeOptimizationScore | Number | No | Default `0` |
| aiSignals.demandPredictionScore | Number | No | Default `0` |
| aiSignals.fraudRiskScore | Number | No | Default `0` |
| aiSignals.profitPredictionScore | Number | No | Default `0` |
| trackingTimeline | Array | No | Stage events |
| trackingTimeline.stage | String | No | Step name |
| trackingTimeline.actor | String | No | Actor name |
| trackingTimeline.note | String | No | Notes |
| trackingTimeline.at | Date | No | Default now |
| deliveryBoy | ObjectId | No | Ref `DeliveryPartner` |
| deliveryStatus | String | No | Enum: `pending`, `accepted`, `picked`, `on-the-way`, `delivered`, `rejected` |
| acceptedAt | Date | No | Delivery timestamp |
| pickedAt | Date | No | Delivery timestamp |
| outForDeliveryAt | Date | No | Delivery timestamp |
| deliveredAt | Date | No | Delivery timestamp |
| deliveryConfirmationOtp | String | No | Default empty |
| deliveryConfirmationPhoto | String | No | Default empty |
| deliveryEarnings | Number | No | Default `0` |

Indexes:
- `location` as `2dsphere`

## Delivery Partner (`DeliveryPartner`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes | Rider name |
| email | String | Yes | Unique |
| password | String | No | Default empty |
| phone | String | Yes | Unique |
| vehicleType | String | Yes | Vehicle type |
| isAvailable | Boolean | No | Default `true` |
| vehicleNumber | String | No | Default empty |
| aadhaarNumber | String | No | Default empty |
| drivingLicenseNumber | String | No | Default empty |
| kycStatus | String | No | Enum: `pending`, `submitted`, `verified`, `rejected` |
| kycDocuments.aadhaarImage | String | No | Default empty |
| kycDocuments.drivingLicenseImage | String | No | Default empty |
| otp | String | No | Delivery login OTP |
| otpExpiresAt | Date | No | OTP expiry |
| lastKnownLocationLabel | String | No | Human-readable location |
| totalEarnings | Number | No | Default `0` |
| completedDeliveries | Number | No | Default `0` |
| address | String | Yes | Base address |
| location.type | String | No | Geo type `Point` |
| location.coordinates | Number[] | Yes | `[lng, lat]` |
| currentOrder | ObjectId | No | Ref `Order` |
| activeOrders | ObjectId[] | No | Refs `Order` |
| maxConcurrentOrders | Number | No | Default `3` |

Indexes:
- `location` as `2dsphere`

## Address (`Address`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| userId | ObjectId | Yes | Ref `User` |
| name | String | No | Receiver name |
| mobile | String | No | Receiver phone |
| pincode | String | No | Postal code |
| locality | String | No | Area/locality |
| fullAddress | String | Yes | Main address text |
| city | String | No | City |
| state | String | No | State |
| landmark | String | No | Landmark |
| alternatePhone | String | No | Alternate contact |
| addressType | String | No | Enum: `Home`, `Work` |
| latitude | Number | No | Coordinate latitude |
| longitude | Number | No | Coordinate longitude |

## Payment (`Payment`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| userId | String | Yes | User identifier |
| addressId | String | Yes | Address identifier |
| orderId | String | Yes | Order identifier |
| paymentId | String | Yes | Payment gateway id |
| signature | String | Yes | Gateway signature |
| amount | Number | Yes | Paid amount |
| status | String | No | Default `success` |
| createdAt | Date | No | Default now |

## Blog (`Blog`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| title | String | Yes | Blog title |
| slug | String | No | Unique, indexed; auto-generated from title |
| image | String | No | URL/path |
| author | String | No | Default `Admin` |
| excerpt | String | No | Summary text |
| content | String | Yes | Full content |
| category | String | No | Enum: `General`, `Restaurants`, `Product`, `Tips`, `Stories`, `News`, `Other` |
| readTime | Number | No | Default `3` minutes |
| status | String | No | Enum: `published`, `draft` |
| publishedAt | Date | No | Default now |

Indexes:
- `slug` unique index

## Feedback (`Feedback`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| userId | ObjectId | Yes | Ref `User` |
| rating | Number | Yes | Range `1..5` |
| comment | String | Yes | Trimmed feedback text |
| status | String | No | Enum: `pending`, `reviewed` |
| reply | String | No | Admin reply |
| createdAt | Date | No | Default now |

## OTP (`OTP`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| email | String | Yes | Target email |
| otp | String | Yes | OTP code |
| createdAt | Date | No | TTL index expires in 300s |

## Restaurant Auth (`RestaurantAuth`)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| name | String | Yes | Restaurant account name |
| email | String | Yes | Unique login email |
| password | String | Yes | Password hash |
| ownerName | String | Yes | Owner display name |
| phone | String | Yes | Contact phone |
| role | String | No | Default `restaurant` |