# Client Main Flowchart

```mermaid
flowchart TD
    start[Open Client App] --> register[Register]
    register --> verify[OTP or Email Verification]
    verify --> login[Login]
    login --> home[Home Page]
    home --> browse[Browse Restaurants]
    browse --> detail[Restaurant Detail]
    detail --> cart[Add Items to Cart]
    cart --> checkout[Checkout]
    checkout --> address[Select or Add Address]
    address --> payment[Choose Payment Method]
    payment --> success[Payment Success]
    success --> invoice[View and Download Invoice]
    success --> orders[My Orders]
    home --> profile[Profile]
    home --> help[Help Center]
    home --> blogs[Blogs]
```