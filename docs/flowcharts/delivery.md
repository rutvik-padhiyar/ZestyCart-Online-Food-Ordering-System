# Delivery Main Flowchart

```mermaid
flowchart TD
    start[Open Delivery App] --> login[Delivery Login]
    login --> dashboard[Delivery Dashboard]
    dashboard --> orders[View Assigned Orders]
    orders --> pick[Accept or Pick Order]
    pick --> route[Track Location and Route]
    route --> otp[Verify OTP]
    otp --> delivered[Mark Delivered]
    delivered --> earnings[Update Earnings]
    earnings --> history[Delivery History]
```