## ZestyCart deployment

### Frontend

Deploy `client` on Vercel.

1. Import the `client` folder as a Vercel project.
2. Framework preset: `Create React App`.
3. Build command: `npm run build`
4. Output directory: `build`
5. Add env:
   - `REACT_APP_BACKEND_URL=https://your-backend-domain.onrender.com`

### Backend

Deploy `server` on Render.

1. Create a new Web Service from this repo.
2. Root directory: `server`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add env vars from [server/.env.example](/server/.env.example)
6. Set:
   - `CLIENT_URL=https://your-frontend-domain.vercel.app`
   - `CLIENT_URL_PREVIEW` if needed

### After deploy

1. Open `https://your-backend-domain.onrender.com/api/health`
2. Open frontend and verify login, restaurants, cart, checkout, admin dashboard
3. In browser install prompt or DevTools, verify manifest + service worker
4. For Razorpay, update production callback domain and keys

### Important

Some frontend files still use `localhost:5000` directly. Before final public launch, replace every remaining hardcoded backend URL in `client/src` with `REACT_APP_BACKEND_URL`.
