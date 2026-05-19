# Complete System UML (Use Case + Activity + Class)

Is file me food ordering system ke 3 detailed UML diagrams diye gaye hain:
1. Use Case Diagram
2. Activity Diagram
3. Class Diagram

## 1) Use Case Diagram
```mermaid
flowchart LR
    Customer[Customer]
    RestaurantOwner[Restaurant Owner]
    DeliveryAgent[Delivery Agent]
    Admin[Admin]
    PaymentGateway[Payment Gateway]

    UC_Register((Register Account))
    UC_Login((Login))
    UC_VerifyOTP((Verify OTP / Email))
    UC_ManageProfile((Manage Profile))
    UC_ManageAddress((Add / Edit / Delete Address))
    UC_BrowseRestaurants((Browse Restaurants))
    UC_SearchFood((Search Food))
    UC_AddToCart((Add Item to Cart))
    UC_ManageCart((Update Cart Quantity))
    UC_Checkout((Checkout))
    UC_SelectAddress((Select Delivery Address))
    UC_ApplyCoupon((Apply Coupon))
    UC_Payment((Pay Online / COD))
    UC_CreateOrder((Place Order))
    UC_TrackOrder((Track Order))
    UC_DownloadInvoice((View / Download Invoice))
    UC_OrderHistory((View Order History))
    UC_Logout((Logout))

    UC_ManageMenu((Manage Menu Items))
    UC_AcceptOrder((Accept or Reject Order))
    UC_UpdateOrderStatus((Update Order Status))

    UC_AcceptDelivery((Accept Delivery Task))
    UC_UpdateDeliveryStatus((Update Delivery Progress))

    UC_ManageUsers((Manage Users))
    UC_ManageRestaurants((Approve / Block Restaurants))
    UC_ViewReports((View Sales and Order Reports))

    Customer --> UC_Register
    Customer --> UC_Login
    Customer --> UC_VerifyOTP
    Customer --> UC_ManageProfile
    Customer --> UC_ManageAddress
    Customer --> UC_BrowseRestaurants
    Customer --> UC_SearchFood
    Customer --> UC_AddToCart
    Customer --> UC_ManageCart
    Customer --> UC_Checkout
    Customer --> UC_TrackOrder
    Customer --> UC_DownloadInvoice
    Customer --> UC_OrderHistory
    Customer --> UC_Logout

    RestaurantOwner --> UC_Login
    RestaurantOwner --> UC_ManageMenu
    RestaurantOwner --> UC_AcceptOrder
    RestaurantOwner --> UC_UpdateOrderStatus
    RestaurantOwner --> UC_Logout

    DeliveryAgent --> UC_Login
    DeliveryAgent --> UC_AcceptDelivery
    DeliveryAgent --> UC_UpdateDeliveryStatus
    DeliveryAgent --> UC_Logout

    Admin --> UC_Login
    Admin --> UC_ManageUsers
    Admin --> UC_ManageRestaurants
    Admin --> UC_ViewReports
    Admin --> UC_Logout

    UC_Checkout -. includes .-> UC_SelectAddress
    UC_Checkout -. includes .-> UC_ApplyCoupon
    UC_Checkout -. includes .-> UC_Payment
    UC_Checkout -. includes .-> UC_CreateOrder
    UC_CreateOrder -. extends .-> UC_DownloadInvoice
    UC_Payment --> PaymentGateway
```

## 2) Activity Diagram
```mermaid
flowchart TD
    Start([Start]) --> OpenApp[Open App]
    OpenApp --> AuthChoice{Already registered?}

    AuthChoice -- No --> Register[Enter name, email, phone, password]
    Register --> VerifySignupOTP[Verify OTP / Email]
    VerifySignupOTP --> LoginPage

    AuthChoice -- Yes --> LoginPage[Enter email or phone and password]
    LoginPage --> LoginValid{Credentials valid?}
    LoginValid -- No --> LoginError[Show error and retry]
    LoginError --> LoginPage
    LoginValid -- Yes --> Home[Dashboard / Home]

    Home --> ManageProfile[Update profile details]
    Home --> AddressStep[Add or choose delivery address]
    Home --> Browse[Browse restaurants and menu]
    Browse --> AddCart[Add items to cart]
    AddCart --> CartReview[Review cart and quantity]
    CartReview --> Checkout[Proceed to checkout]

    Checkout --> AddressConfirm{Address selected?}
    AddressConfirm -- No --> AddressStep
    AddressConfirm -- Yes --> CouponChoice{Apply coupon?}

    CouponChoice -- Yes --> ApplyCoupon[Validate coupon]
    ApplyCoupon --> PaymentMode
    CouponChoice -- No --> PaymentMode[Choose payment mode]

    PaymentMode --> PaymentType{Online payment?}
    PaymentType -- Yes --> Gateway[Redirect to payment gateway]
    Gateway --> PaymentStatus{Payment success?}
    PaymentStatus -- No --> PaymentFail[Show failure and retry/COD]
    PaymentFail --> PaymentMode
    PaymentStatus -- Yes --> PlaceOrder

    PaymentType -- No --> PlaceOrder[Create order with COD]

    PlaceOrder --> NotifyRestaurant[Send order to restaurant]
    NotifyRestaurant --> RestaurantDecision{Accepted by restaurant?}
    RestaurantDecision -- No --> OrderRejected[Order cancelled and refund if paid]
    OrderRejected --> End([End])

    RestaurantDecision -- Yes --> PrepareFood[Restaurant prepares order]
    PrepareFood --> AssignRider[Assign delivery agent]
    AssignRider --> OutForDelivery[Order out for delivery]
    OutForDelivery --> Delivered[Order delivered]

    Delivered --> GenerateInvoice[Generate invoice]
    GenerateInvoice --> DownloadInvoice[Customer views/downloads invoice]
    DownloadInvoice --> OrderHistory[Save order in history]

    OrderHistory --> UserAction{Logout now?}
    UserAction -- Yes --> Logout[Logout and clear session]
    Logout --> End
    UserAction -- No --> Home
```

## 3) Class Diagram
```mermaid
classDiagram
    direction LR

    class User {
      +String id
      +String name
      +String email
      +String phone
      +String passwordHash
      +String role
      +String status
      +Date createdAt
      +register()
      +login()
      +logout()
      +verifyOtp(code)
    }

    class CustomerProfile {
      +String userId
      +String avatarUrl
      +String preferredLanguage
      +updateProfile()
    }

    class Address {
      +String id
      +String userId
      +String label
      +String line1
      +String line2
      +String city
      +String state
      +String postalCode
      +String country
      +Double latitude
      +Double longitude
      +Boolean isDefault
      +validate()
    }

    class Restaurant {
      +String id
      +String ownerId
      +String name
      +String cuisine
      +String status
      +openTime
      +closeTime
      +acceptOrder(orderId)
      +rejectOrder(orderId)
    }

    class MenuItem {
      +String id
      +String restaurantId
      +String name
      +String description
      +Decimal price
      +Boolean isVeg
      +Boolean isAvailable
      +updateAvailability()
    }

    class Cart {
      +String id
      +String userId
      +Decimal totalAmount
      +addItem(itemId, qty)
      +removeItem(itemId)
      +recalculate()
      +clear()
    }

    class CartItem {
      +String id
      +String cartId
      +String menuItemId
      +int quantity
      +Decimal unitPrice
      +Decimal lineTotal
      +computeLineTotal()
    }

    class Order {
      +String id
      +String userId
      +String restaurantId
      +String addressId
      +String status
      +String paymentStatus
      +Decimal subtotal
      +Decimal deliveryFee
      +Decimal taxAmount
      +Decimal discountAmount
      +Decimal grandTotal
      +Date orderedAt
      +place()
      +cancel()
      +updateStatus(newStatus)
    }

    class OrderItem {
      +String id
      +String orderId
      +String menuItemId
      +int quantity
      +Decimal unitPrice
      +Decimal lineTotal
    }

    class Payment {
      +String id
      +String orderId
      +String method
      +String gateway
      +String transactionId
      +String status
      +Decimal amount
      +Date paidAt
      +initiate()
      +verify()
      +refund()
    }

    class Invoice {
      +String id
      +String orderId
      +String invoiceNumber
      +Date generatedAt
      +Decimal amount
      +String pdfUrl
      +generate()
      +download()
    }

    class DeliveryAgent {
      +String id
      +String userId
      +String vehicleType
      +String availabilityStatus
      +acceptTask(orderId)
      +markPickedUp(orderId)
      +markDelivered(orderId)
    }

    class Notification {
      +String id
      +String userId
      +String channel
      +String title
      +String message
      +Date sentAt
      +send()
    }

    class AuthSession {
      +String id
      +String userId
      +String token
      +Date issuedAt
      +Date expiresAt
      +Boolean isRevoked
      +revoke()
      +isValid()
    }

    User "1" -- "0..1" CustomerProfile : has
    User "1" -- "0..*" Address : manages
    User "1" -- "0..1" Cart : owns
    Cart "1" -- "1..*" CartItem : contains
    CartItem "*" --> "1" MenuItem : references

    Restaurant "1" -- "1..*" MenuItem : lists
    Restaurant "1" -- "0..*" Order : receives

    User "1" -- "0..*" Order : places
    Order "1" -- "1..*" OrderItem : includes
    OrderItem "*" --> "1" MenuItem : snapshots
    Order "1" --> "1" Address : deliveredTo

    Order "1" -- "0..1" Payment : paidBy
    Order "1" -- "1" Invoice : generates
    DeliveryAgent "1" -- "0..*" Order : fulfills

    User "1" -- "0..*" Notification : receives
    User "1" -- "0..*" AuthSession : creates
```