import React from "react";
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

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminRoute && <Navbar />}
      <div className={isAdminRoute ? "min-h-screen" : "flex-grow pt-16"}>
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
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
