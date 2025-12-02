import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";


/*
  Checkout.jsx (3D Card Lift UI)
  - Add / Edit / Delete addresses (saved on backend)
  - Fetch addresses on load & after CRUD ops (persistent)
  - Save uses token from localStorage if available
  - Subtle 3D hover tilt on address cards
*/

export default function Checkout() {
  const token = localStorage.getItem("token") || null;
  const userId = localStorage.getItem("userId") || "";

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loadingCart, setLoadingCart] = useState(true);

  const [emergency, setEmergency] = useState(false);
  const EMERGENCY_FEE = 12;

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    pincode: "",
    locality: "",
    fullAddress: "",
    city: "",
    state: "",
    landmark: "",
    addressType: "Home",
    latitude: "",
    longitude: "",
  });

  const [savingAddress, setSavingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ref to form container for scroll
  const formRef = useRef(null);

  //navigation
  const navigate = useNavigate();


  // axios config helper
  const axiosConfig = () =>
    token ? { headers: { Authorization: `Bearer ${token}` } } : {};

// rezorpay
  useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  document.body.appendChild(script);
}, []);

  // ------------------ Fetch Cart ------------------
  useEffect(() => {
    async function fetchCart() {
      setLoadingCart(true);
      try {
        let res;
        try {
          res = await axios.get("http://localhost:5000/api/cart", axiosConfig());
        } catch (err) {
          if (userId) {
            res = await axios.get(`http://localhost:5000/api/cart/get/${userId}`, axiosConfig());
          } else {
            throw err;
          }
        }

        const cartData = res.data.cart || res.data || { items: [] };
        let total = 0;
        const items = cartData.items || [];
        items.forEach((it) => {
          const price = it.product?.price ?? it.price ?? 0;
          const qty = it.quantity ?? 1;
          total += Number(price) * Number(qty);
        });

        setCart({ items, total });
      } catch (err) {
        console.error("Cart fetch error:", err?.response?.data || err.message);
        setCart({ items: [], total: 0 });
      } finally {
        setLoadingCart(false);
      }
    }

    fetchCart();
  }, [token, userId]);

  // ------------------ Fetch Saved Addresses ------------------
  const fetchAddresses = async () => {
    try {
      // prefer token-protected list endpoint
      let res;
      // Try token-protected "list" (no param) first
      try {
        res = await axios.get("http://localhost:5000/api/address/list", axiosConfig());
      } catch (err) {
        // fallback to param-based list if backend expects userId in path
        if (userId) {
          res = await axios.get(`http://localhost:5000/api/address/list/${userId}`, axiosConfig());
        } else {
          throw err;
        }
      }

      // backend might return { success, addresses } or array
      const addresses = res.data?.addresses ?? res.data ?? [];
      setSavedAddresses(Array.isArray(addresses) ? addresses : []);
    } catch (err) {
      console.warn("No saved addresses or address list API failed.", err?.response?.data || err.message);
      setSavedAddresses([]);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId]);


  // ------------------ Use My Current Location -> reverse geocode ------------------
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser does not support geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
          const r = await fetch(url);
          const data = await r.json();

          setForm((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
            pincode: data.address?.postcode || prev.pincode,
            city: data.address?.city || data.address?.town || data.address?.village || prev.city,
            state: data.address?.state || prev.state,
            locality: data.address?.suburb || data.address?.neighbourhood || prev.locality,
            fullAddress: data.display_name || prev.fullAddress,
          }));

          // scroll into view
          formRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
          console.error("Reverse geocode failed:", err);
          alert("Failed to fetch address from your location.");
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Unable to get your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ------------------ Save New Address ------------------
  const saveAddress = async () => {
    // basic validation
    if (!form.name || !form.mobile || !form.fullAddress) {
      toast.warn("Please fill Name, Mobile and Full Address.", { position: "top-center" });
      return;
    }

    setSavingAddress(true);
    try {
      const payload = {
        ...form,
        userId: userId || undefined, // backend linking via token if available
      };

      const res = await axios.post("http://localhost:5000/api/address/add", payload, axiosConfig());
      const saved = res.data?.address || res.data;

      // prefer refetch to ensure canonical data from DB
      await fetchAddresses();

      toast.success("Address saved.", { position: "top-center" });

      // auto-select newly saved address if returned
      if (saved?._id) setSelectedAddressId(saved._id);

      // clear form
      setForm({
        name: "",
        mobile: "",
        pincode: "",
        locality: "",
        fullAddress: "",
        city: "",
        state: "",
        landmark: "",
        addressType: "Home",
        latitude: "",
        longitude: "",
      });
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      console.error("Save address failed:", err?.response?.data || err.message);
      toast.error("Failed to save address.", { position: "top-center" });
    } finally {
      setSavingAddress(false);
    }
  };

  // ------------------ Start Edit ------------------
  const startEdit = (addr) => {
    setIsEditing(true);
    setEditingId(addr._id);
    setForm({
      name: addr.name || "",
      mobile: addr.mobile || "",
      pincode: addr.pincode || "",
      locality: addr.locality || "",
      fullAddress: addr.fullAddress || "",
      city: addr.city || "",
      state: addr.state || "",
      landmark: addr.landmark || "",
      addressType: addr.addressType || "Home",
      latitude: addr.latitude || "",
      longitude: addr.longitude || "",
    });

    // scroll to form
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ------------------ Update Address ------------------
  const updateAddress = async () => {
    if (!editingId) return;
    if (!form.name || !form.mobile || !form.fullAddress) {
      toast.warn("Please fill Name, Mobile and Full Address.", { position: "top-center" });
      return;
    }

    setSavingAddress(true);
    try {
      await axios.put(`http://localhost:5000/api/address/update/${editingId}`, form, axiosConfig());

      await fetchAddresses();
      toast.success("Address updated.", { position: "top-center" });

      setIsEditing(false);
      setEditingId(null);
      setForm({
        name: "",
        mobile: "",
        pincode: "",
        locality: "",
        fullAddress: "",
        city: "",
        state: "",
        landmark: "",
        addressType: "Home",
        latitude: "",
        longitude: "",
      });
    } catch (err) {
      console.error("Update address failed:", err?.response?.data || err.message);
      toast.error("Failed to update address.", { position: "top-center" });
    } finally {
      setSavingAddress(false);
    }
  };

  // ------------------ Delete Address ------------------
  const deleteAddress = async (id) => {
    if (!window.confirm("Delete this address? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/address/delete/${id}`, axiosConfig());
      await fetchAddresses();
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.success("Address deleted.", { position: "top-center" });
    } catch (err) {
      console.error("Delete address failed:", err?.response?.data || err.message);
      toast.error("Failed to delete address.", { position: "top-center" });
    }
  };

  // ------------------ Place Order ------------------
  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.warn("Please select or save an address before placing the order.", { position: "top-center" });
      return;
    }

    setPlacingOrder(true);
    try {
      const addr = savedAddresses.find((a) => a._id === selectedAddressId);

      const payload = {
        address: addr.fullAddress || "",
        mobile: addr.mobile || form.mobile || "",
        addressId: addr._id,
        location: {
          lat: Number(addr.latitude || form.latitude || 0),
          lng: Number(addr.longitude || form.longitude || 0),
        },
        emergency: !!emergency,
      };

      await axios.post("http://localhost:5000/api/order/place", payload, axiosConfig());

      toast.success("Order placed successfully! 🎉", { position: "top-center" });
      // optionally redirect
    } catch (err) {
      console.error("Order place error:", err?.response?.data || err.message);
      toast.error("Failed to place order.", { position: "top-center" });
    } finally {
      setPlacingOrder(false);
    }
  };
  
 
// paynow

const payNow = async () => {
  if (!selectedAddressId) {
    toast.error("Please select address!");
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:5000/api/payment/create-order",
      { amount: totalPayable }
    );

    const order = res.data.order;
    const key = res.data.key;

    const options = {
      key,
      amount: order.amount,
      currency: "INR",
      name: "Food App",
      description: "Food Order Payment",
      order_id: order.id,

      handler: async function (response) {
        const verify = await axios.post(
          "http://localhost:5000/api/payment/verify",
          response
        );

        if (verify.data.success) toast.success("Payment Successful!");
        else toast.error("Payment Failed!");
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error(error);
    toast.error("Payment initialization failed!");
  }
};



  // small helper to set form fields
  const setFormField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // 3D tilt helpers: simple mousemove-based transform
  const handleCardMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element
    const y = e.clientY - rect.top; // y position within the element
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx; // -1 .. 1
    const dy = (y - cy) / cy; // -1 .. 1
    const tiltX = dy * 6; // degrees
    const tiltY = dx * -6;
    el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
  };

  const handleCardLeave = (e) => {
    const el = e.currentTarget;
    el.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
  };

  // compute totals
  const foodTotal = cart.total || 0;
  const emergencyCharge = emergency ? EMERGENCY_FEE : 0;
  const totalPayable = foodTotal + emergencyCharge;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50 to-white p-6">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-6 drop-shadow-sm">
          Delivery Address
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Saved addresses + summary */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="font-semibold text-lg mb-3">Saved Addresses</h2>

              {savedAddresses.length === 0 ? (
                <div className="text-gray-500 py-6">No saved addresses yet. Add one on the right.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedAddresses.map((a) => (
                    <div
                      key={a._id}
                      onMouseMove={handleCardMove}
                      onMouseLeave={handleCardLeave}
                      className={`relative bg-white rounded-2xl p-4 border transition-shadow duration-300 shadow-md hover:shadow-2xl cursor-pointer`}
                    >
                      <label className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="addr"
                          className="mt-1"
                          checked={selectedAddressId === a._id}
                          onChange={() => setSelectedAddressId(a._id)}
                        />

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-800">{a.name || "Unknown"}</div>
                              <div className="text-sm text-gray-600">{a.mobile}</div>
                            </div>

                            <div className="text-sm text-gray-500">{a.addressType || "Home"}</div>
                          </div>

                          <div className="mt-2 text-gray-700">{a.fullAddress}</div>
                          <div className="mt-2 text-sm text-gray-500">
                            {a.locality} • {a.city} • {a.pincode}
                          </div>

                          <div className="mt-3 flex gap-3">
                            <button
                              onClick={() => startEdit(a)}
                              className="text-sm px-3 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteAddress(a._id)}
                              className="text-sm px-3 py-1 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price summary + Emergency */}
            <div className="bg-white rounded-2xl shadow-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emergency}
                    onChange={() => setEmergency(!emergency)}
                  />
                  <span className="text-gray-700">Add Emergency Delivery (₹{EMERGENCY_FEE} extra)</span>
                </label>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-600">Food Total: <span className="font-semibold">₹{foodTotal}</span></div>
                <div className="text-sm text-gray-600">Emergency: <span className="font-semibold">₹{emergencyCharge}</span></div>
                <div className="mt-2 text-xl font-bold text-green-700">Total Payable: ₹{totalPayable}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
<button
  onClick={payNow}
  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl mt-4 text-lg"
>
  Pay Now
</button>



              <button
                onClick={() => {
                  setSelectedAddressId(null);
                  formRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white border border-gray-300 px-4 py-2 rounded-xl text-gray-700"
              >
                Add / Edit Address
              </button>
            </div>
          </div>

          {/* RIGHT: Add new address form */}
          <div className="bg-white rounded-2xl shadow-xl p-6" id="address-form" ref={formRef}>
            <h2 className="font-semibold text-lg mb-3">{isEditing ? "Edit Address" : "Add New Address"}</h2>

            <button
              onClick={useCurrentLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mb-4 inline-flex items-center gap-2"
            >
              📍 Use My Current Location
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="border p-2 rounded"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setFormField("name", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Mobile"
                value={form.mobile}
                onChange={(e) => setFormField("mobile", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Pincode"
                value={form.pincode}
                onChange={(e) => setFormField("pincode", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Locality"
                value={form.locality}
                onChange={(e) => setFormField("locality", e.target.value)}
              />
              <textarea
                className="border p-2 rounded sm:col-span-2"
                placeholder="Full Address"
                value={form.fullAddress}
                onChange={(e) => setFormField("fullAddress", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="City / District"
                value={form.city}
                onChange={(e) => setFormField("city", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="State"
                value={form.state}
                onChange={(e) => setFormField("state", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Landmark (optional)"
                value={form.landmark}
                onChange={(e) => setFormField("landmark", e.target.value)}
              />

              <div className="sm:col-span-2 flex items-center gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addrType"
                    checked={form.addressType === "Home"}
                    onChange={() => setFormField("addressType", "Home")}
                  />
                  Home
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="addrType"
                    checked={form.addressType === "Work"}
                    onChange={() => setFormField("addressType", "Work")}
                  />
                  Work
                </label>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={updateAddress}
                    disabled={savingAddress}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
                  >
                    {savingAddress ? "Updating..." : "Update Address"}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setForm({
                        name: "",
                        mobile: "",
                        pincode: "",
                        locality: "",
                        fullAddress: "",
                        city: "",
                        state: "",
                        landmark: "",
                        addressType: "Home",
                        latitude: "",
                        longitude: "",
                      });
                    }}
                    className="bg-white border border-gray-300 px-4 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={saveAddress}
                  disabled={savingAddress}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* small notice */}
        <div className="text-sm text-gray-500 mt-6">
          Tip: Use the "Use My Current Location" button on mobile for best accuracy.
        </div>
      </div>
    </div>
  );
}

/* Uses Tailwind classes — if you are not using Tailwind, replace with your CSS.
   3D tilt effect is applied inline on mouse move (handleCardMove/handleCardLeave).
*/
