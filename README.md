# Food Ordering System

This repository contains four apps that work together:

- `server`: Express + MongoDB API
- `client`: customer and admin frontend
- `restaurant`: restaurant portal
- `delivery`: delivery partner portal

## Quick start

1. Install the root helper dependency:

   ```bash
   npm install
   ```

2. Install app dependencies:

   ```bash
   npm run install:all
   ```

3. Create local environment files from the examples:

   - `server/.env.example` -> `server/.env`
   - `client/.env.example` -> `client/.env`
   - `restaurant/.env.example` -> `restaurant/.env`
   - `delivery/.env.example` -> `delivery/.env`

4. Start the whole stack:

   ```bash
   npm run dev
   ```

## Local ports

- Client: `http://localhost:3000`
- Delivery: `http://localhost:3001`
- Restaurant: `http://localhost:3002`
- Server: `http://localhost:5000`

## Useful commands

- `npm run dev`: run every app together
- `npm run dev:server`: run only the API
- `npm run dev:client`: run only the customer/admin app
- `npm run dev:restaurant`: run only the restaurant app
- `npm run dev:delivery`: run only the delivery app
- `npm run build`: build all frontend apps

## Notes

- The backend requires MongoDB and valid secrets in `server/.env`.
- Payment, email, SMS, and maps features need their respective keys before those flows will work fully.
- Frontend apps default to `http://localhost:5000` if their API environment variable is missing.
