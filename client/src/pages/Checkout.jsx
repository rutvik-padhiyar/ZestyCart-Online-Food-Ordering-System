import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CreditCard, LocateFixed, Truck } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckoutMap from "../components/CheckoutMap";

const API_BASE = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function Checkout() {
  const token = localStorage.getItem("token") || null;
  const userId = localStorage.getItem("userId") || "";
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [emergency, setEmergency] = useState(false);
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const EMERGENCY_FEE = 12;

  const axiosConfig = useMemo(() => (token ? { headers: { Authorization: `Bearer ${token}` } } : {}), [token]);

  const fetchCart = useCallback(async () => {
    try {
      let res;
      try {
        res = await axios.get(`${API_BASE}/api/cart`, axiosConfig);
      } catch (error) {
        if (userId) {
          res = await axios.get(`${API_BASE}/api/cart/get/${userId}`, axiosConfig);
        } else {
          throw error;
        }
      }

      const cartData = res.data.cart || res.data || { items: [] };
      const items = cartData.items || [];
      const total = items.reduce((sum, item) => sum + Number(item.product?.price || item.price || 0) * Number(item.quantity || 1), 0);
      setCart({ items, total });
    } catch (error) {
      setCart({ items: [], total: 0 });
    }
  }, [axiosConfig, userId]);

  const fetchAddresses = useCallback(async () => {
    try {
      let res;
      try {
        res = await axios.get(`${API_BASE}/api/address/list`, axiosConfig);
      } catch (error) {
        if (userId) {
          res = await axios.get(`${API_BASE}/api/address/list/${userId}`, axiosConfig);
        } else {
          throw error;
        }
      }
      const addresses = res.data?.addresses ?? res.data ?? [];
      setSavedAddresses(Array.isArray(addresses) ? addresses : []);
    } catch (error) {
      setSavedAddresses([]);
    }
  }, [axiosConfig, userId]);

  useEffect(() => {
    const existingScript = document.querySelector('script[data-razorpay="true"]');
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.setAttribute("data-razorpay", "true");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, [fetchCart, fetchAddresses]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await res.json();
        const a = data.address || {};
        const fullAddress = [a.attraction, a.building, a.road, a.neighbourhood || a.suburb, a.village || a.town || a.city, a.state, a.postcode]
          .filter(Boolean)
          .join(", ");

        setForm((prev) => ({
          ...prev,
          fullAddress: fullAddress || data.display_name || "",
          locality: a.neighbourhood || a.suburb || "",
          city: a.village || a.town || a.city || "",
          state: a.state || "",
          pincode: a.postcode || "",
        }));
      },
      () => alert("Location permission denied"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const setFormField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const emptyForm = () => ({
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

  const saveAddress = async () => {
    if (!form.name || !form.mobile || !form.fullAddress) {
      toast.warn("Please fill Name, Mobile and Full Address.");
      return;
    }

    setSavingAddress(true);
    try {
      const payload = { ...form, userId: userId || undefined };
      const res = await axios.post(`${API_BASE}/api/address/add`, payload, axiosConfig);
      const saved = res.data?.address || res.data;
      await fetchAddresses();
      if (saved?._id) setSelectedAddressId(saved._id);
      setForm(emptyForm());
      setIsEditing(false);
      setEditingId(null);
      toast.success("Address saved.");
    } catch (error) {
      toast.error("Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

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
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateAddress = async () => {
    if (!editingId) return;
    if (!form.name || !form.mobile || !form.fullAddress) {
      toast.warn("Please fill Name, Mobile and Full Address.");
      return;
    }

    setSavingAddress(true);
    try {
      await axios.put(`${API_BASE}/api/address/update/${editingId}`, form, axiosConfig);
      await fetchAddresses();
      setIsEditing(false);
      setEditingId(null);
      setForm(emptyForm());
      toast.success("Address updated.");
    } catch (error) {
      toast.error("Failed to update address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await axios.delete(`${API_BASE}/api/address/delete/${id}`, axiosConfig);
      await fetchAddresses();
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.success("Address deleted.");
    } catch (error) {
      toast.error("Failed to delete address.");
    }
  };

  const placeOrder = async () => {
    if (!selectedAddressId) {
      toast.warn("Please select an address before placing the order.");
      return;
    }

    setPlacingOrder(true);
    try {
      const addr = savedAddresses.find((item) => item._id === selectedAddressId);
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

      const response = await axios.post(`${API_BASE}/api/order/place`, payload, axiosConfig);
      toast.success("Order placed successfully.");
      navigate(`/thank-you/${response.data.order._id}`, { state: { order: response.data.order } });
    } catch (error) {
      toast.error("Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const getRazorpayKey = async () => {
    const res = await axios.get(`${API_BASE}/api/razorpay-key`);
    return res.data.key;
  };

  const foodTotal = cart.total || 0;
  const emergencyCharge = emergency ? EMERGENCY_FEE : 0;
  const totalPayable = foodTotal + emergencyCharge;

  const payNow = async () => {
    if (!selectedAddressId) {
      toast.warn("Please select address first");
      return;
    }

    try {
      const addr = savedAddresses.find((item) => item._id === selectedAddressId);
      if (!addr) {
        toast.warn("Selected address not found");
        return;
      }

      const razorpayKey = await getRazorpayKey();
      const orderRes = await axios.post(
        `${API_BASE}/api/payment/create-order`,
        { amount: totalPayable },
        axiosConfig
      );

      const orderData = orderRes.data.order;
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: "INR",
        name: "ZestyCart",
        description: "Food Order Payment",
        order_id: orderData.id,
        handler: async function (response) {
          const verify = await axios.post(`${API_BASE}/api/payment/verify`, response);
          if (verify.data.success) {
            const payload = {
              address: addr.fullAddress || "",
              mobile: addr.mobile || form.mobile || "",
              addressId: addr._id,
              paymentMethod: "Online",
              location: {
                lat: Number(addr.latitude || form.latitude || 0),
                lng: Number(addr.longitude || form.longitude || 0),
              },
              emergency: !!emergency,
            };

            const placedOrder = await axios.post(
              `${API_BASE}/api/order/place`,
              payload,
              axiosConfig
            );

            if (placedOrder.data?.order?._id) {
              navigate(`/thank-you/${placedOrder.data.order._id}`, { state: { order: placedOrder.data.order } });
              return;
            }

            toast.error("Order placed but invoice page could not open.");
          } else {
            toast.error("Payment Failed");
          }
        },
        theme: { color: "#10b981" },
        callback_url: `${API_BASE}/api/payment/verify`,
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Payment failed");
    }
  };

  return (
    <div className="public-shell">
      <ToastContainer />
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white">
          <div className="public-pill">Checkout</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Finalize delivery, payment and address details.</h1>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-8">
            <section className="public-card rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Saved addresses</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">Choose delivery location</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAddressId(null);
                    formRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="public-button public-button-secondary text-sm"
                >
                  Add New
                </button>
              </div>

              {savedAddresses.length === 0 ? (
                <div className="mt-6 rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">No saved addresses yet. Add one below.</div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {savedAddresses.map((address) => (
                    <label key={address._id} className={`cursor-pointer rounded-[26px] border p-5 transition ${selectedAddressId === address._id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="address" checked={selectedAddressId === address._id} onChange={() => setSelectedAddressId(address._id)} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-semibold text-slate-950">{address.name}</p>
                              <p className="text-sm text-slate-500">{address.mobile}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {address.addressType || "Home"}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600">{address.fullAddress}</p>
                          <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => startEdit(address)} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
                              Edit
                            </button>
                            <button type="button" onClick={() => deleteAddress(address._id)} className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </section>

            <section ref={formRef} className="public-card rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Address form</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{isEditing ? "Edit Address" : "Add Address"}</h2>
                </div>
                <button type="button" onClick={useCurrentLocation} className="public-button public-button-primary text-sm">
                  <LocateFixed size={16} />
                  Use Current Location
                </button>
              </div>

              <div className="mt-6 overflow-hidden rounded-[26px] border border-slate-200">
                <CheckoutMap lat={form.latitude} lng={form.longitude} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input className="public-input" placeholder="Name" value={form.name} onChange={(e) => setFormField("name", e.target.value)} />
                <input className="public-input" placeholder="Mobile" value={form.mobile} onChange={(e) => setFormField("mobile", e.target.value)} />
                <input className="public-input" placeholder="Pincode" value={form.pincode} onChange={(e) => setFormField("pincode", e.target.value)} />
                <input className="public-input" placeholder="Locality" value={form.locality} onChange={(e) => setFormField("locality", e.target.value)} />
                <textarea className="public-input md:col-span-2 min-h-[110px]" placeholder="Full Address" value={form.fullAddress} onChange={(e) => setFormField("fullAddress", e.target.value)} />
                <input className="public-input" placeholder="City" value={form.city} onChange={(e) => setFormField("city", e.target.value)} />
                <input className="public-input" placeholder="State" value={form.state} onChange={(e) => setFormField("state", e.target.value)} />
                <input className="public-input md:col-span-2" placeholder="Landmark" value={form.landmark} onChange={(e) => setFormField("landmark", e.target.value)} />
              </div>

              <div className="mt-5 flex gap-5">
                {["Home", "Work"].map((type) => (
                  <label key={type} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="radio" checked={form.addressType === type} onChange={() => setFormField("addressType", type)} />
                    {type}
                  </label>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <button type="button" disabled={savingAddress} onClick={updateAddress} className="public-button public-button-primary">
                      {savingAddress ? "Updating..." : "Update Address"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingId(null);
                        setForm(emptyForm());
                      }}
                      className="public-button public-button-secondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" disabled={savingAddress} onClick={saveAddress} className="public-button public-button-primary">
                    {savingAddress ? "Saving..." : "Save Address"}
                  </button>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="public-card rounded-[32px] p-6">
              <div className="rounded-[26px] bg-slate-950 px-5 py-5 text-white">
                <p className="text-lg font-semibold">Order Summary</p>
                <div className="mt-5 space-y-3 text-sm text-slate-300">
                  <div className="flex justify-between"><span>Items</span><span>{cart.items.length}</span></div>
                  <div className="flex justify-between"><span>Food Total</span><span>Rs {foodTotal}</span></div>
                  <div className="flex justify-between"><span>Emergency</span><span>Rs {emergencyCharge}</span></div>
                  <div className="border-t border-white/10 pt-3 text-xl font-semibold text-emerald-300">Total Rs {totalPayable}</div>
                </div>
              </div>

              <label className="mt-5 flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={emergency} onChange={() => setEmergency(!emergency)} />
                Add emergency delivery (Rs {EMERGENCY_FEE})
              </label>

              <div className="mt-6 grid gap-3">
                <button type="button" onClick={payNow} className="public-button public-button-primary w-full">
                  <CreditCard size={16} />
                  Pay Now
                </button>
                <button type="button" disabled={placingOrder} onClick={placeOrder} className="public-button public-button-secondary w-full bg-slate-950 text-white">
                  <Truck size={16} />
                  {placingOrder ? "Placing Order..." : "Cash on Delivery"}
                </button>
              </div>
            </section>

            <section className="public-glass rounded-[32px] px-6 py-6 text-sm leading-7 text-slate-300">
              Tip: current location use karoge to delivery accuracy better milegi.
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
