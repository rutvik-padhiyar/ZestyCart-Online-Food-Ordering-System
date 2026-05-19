# Admin Main Flowchart

```mermaid
flowchart TD
    start[Open Admin Panel] --> login[Admin Login or 2FA]
    login --> dashboard[Admin Dashboard]
    dashboard --> orders[Manage Orders]
    dashboard --> foods[Manage Foods]
    dashboard --> restaurants[Manage Restaurants]
    dashboard --> users[Manage Users]
    dashboard --> blogs[Manage Blogs]
    dashboard --> feedback[Review Feedback]
    dashboard --> partners[Manage Delivery Partners]
    orders --> orderAction[Update Order Status]
    foods --> foodAction[Add or Edit Foods]
    restaurants --> restaurantAction[Approve or Edit Restaurant]
    users --> userAction[Block or Activate User]
```