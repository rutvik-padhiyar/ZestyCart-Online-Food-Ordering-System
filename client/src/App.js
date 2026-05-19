import React, { useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import "./styles/public.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FoodShowcaseBanner from "./components/FoodShowcaseBanner";
import { CartProvider } from "./context/CartContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddFood from "./pages/AddFood";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import AddRestaurant from "./pages/AddRestaurant";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantPage from "./pages/RestaurantPage";
import RestaurantDetail from "./pages/RestaurantDetail";
import CartPage from "./components/CartPage";
import AllRestaurants from "./pages/AllRestaurants";
import MyOrders from "./pages/MyOrders";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./components/Profile";
import HelpCenter from "./pages/HelpCenter";
import AdminFeedbacks from "./pages/admin/AdminFeedbacks";
import ThankYouPage from "./pages/ThankYouPage";
import BlogList from "./pages/BlogList";
import BlogDetail from "./pages/BlogDetail";
import AdminBlogs from "./pages/admin/AdminBlogs";
import BlogForm from "./pages/admin/BlogForm";
import AddBlog from "./pages/admin/AddBlog";
import EditBlog from "./pages/admin/EditBlog";
import AllUsers from "./pages/AllUsers";
import AllFoods from "./pages/AllFoods";
import EditFood from "./pages/EditFood";
import RestaurantManagement from "./pages/admin/ResturentManagement";
import EditRestaurant from "./pages/EditRestaurant";
import CheckoutPage from "./pages/Checkout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveryPartners from "./pages/admin/AdminDeliveryPartners";
import Admin2FAVerify from "./pages/admin/Admin2FAVerify";
import Enable2FA from "./pages/admin/Enable2FA";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { getStoredToken, setStoredUser, validateStoredToken } from "./utils/auth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const validateSession = async () => {
      const decoded = validateStoredToken();
      if (!decoded) {
        return;
      }

      const token = getStoredToken();
      if (!token) {
        return;
      }

      try {
        const response = await axios.get(`${BACKEND_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStoredUser(response.data);
      } catch (error) {
        // Global axios interceptor clears invalid sessions automatically.
      }
    };

    validateSession();

    const handleWindowFocus = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      validateSession();
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        validateSession();
      }
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleWindowFocus);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleWindowFocus);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", handleWindowFocus);
    };
  }, []);

  return (
    <div className="app-shell">
      {!isAdminRoute && <Navbar />}
      <div className={isAdminRoute ? "app-main app-main-admin" : "app-main"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nearby-restaurants" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/add-food" element={<AddFood />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/add-restaurant" element={<AddRestaurant />} />
          <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant/:id" element={<RestaurantPage />} />
          <Route path="/restaurants/:id/detail" element={<RestaurantDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/restaurants" element={<AllRestaurants />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/my-profile" element={<Profile />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route path="/thank-you/:orderId" element={<ThankYouPage />} />
          <Route path="/blogs" element={<BlogList />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/admin/verify-2fa" element={<Admin2FAVerify />} />
          <Route path="/admin/enable-2fa" element={<Enable2FA />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/feedbacks" element={<AdminFeedbacks />} />
          <Route path="/admin/blogs" element={<AdminBlogs />} />
          <Route path="/admin/blogs/new" element={<BlogForm />} />
          <Route path="/admin/blogs/:id/edit" element={<BlogForm />} />
          <Route path="/admin/blogs/add" element={<AddBlog />} />
          <Route path="/admin/blogs/edit/:id" element={<EditBlog />} />
          <Route path="/admin/users" element={<AllUsers />} />
          <Route path="/admin/foods" element={<AllFoods />} />
          <Route path="/admin/delivery-partners" element={<AdminDeliveryPartners />} />
          <Route path="/admin/edit-food/:id" element={<EditFood />} />
          <Route path="/admin/restaurants" element={<RestaurantManagement />} />
          <Route path="/admin/edit-restaurant/:id" element={<EditRestaurant />} />
        </Routes>
      </div>
      {!isAdminRoute && <FoodShowcaseBanner />}
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AppErrorBoundary>
        <Router>
          <AppContent />
        </Router>
      </AppErrorBoundary>
    </CartProvider>
  );
}

export default App;
