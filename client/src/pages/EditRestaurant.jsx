// src/pages/EditRestaurant.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import Autosuggest from "react-autosuggest";
import { useParams, useNavigate } from "react-router-dom";


const EditRestaurant = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    mobile: "",
    email: "",
    panCardNumber: "",
    fssaiNumber: "",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
  });

  const [panCardImage, setPanCardImage] = useState(null);
  const [restaurantImage, setRestaurantImage] = useState(null);

  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch restaurant details
  useEffect(() => {
    const fetchRestaurant = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(
          `${process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000"}/api/admin/restaurants/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const r = res.data;
        setFormData({
          name: r.name || "",
          ownerName: r.ownerName || "",
          mobile: r.mobile || "",
          email: r.email || "",
          panCardNumber: r.panCardNumber || "",
          fssaiNumber: r.fssaiLicense || "",
          bankAccountNumber: r.bankDetails?.accountNumber || "",
          ifscCode: r.bankDetails?.ifsc || "",
          upiId: r.upiId || "",
        });
        setAddress(r.address || "");
        setLatitude(r.location?.coordinates?.[1] || null);
        setLongitude(r.location?.coordinates?.[0] || null);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        alert("Failed to load restaurant data");
      }
    };
    fetchRestaurant();
  }, [id]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Autosuggest handlers
  const onAddressChange = (event, { newValue }) => setAddress(newValue);
  const onSuggestionsFetchRequested = async ({ value }) => {
    if (!value) return setSuggestions([]);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${value}`
      );
      setSuggestions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };
  const onSuggestionsClearRequested = () => setSuggestions([]);
  const onSuggestionSelected = (event, { suggestion }) => {
    setAddress(suggestion.display_name);
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lon);
  };
  const getSuggestionValue = (suggestion) => suggestion.display_name;
  const renderSuggestion = (suggestion) => <div>{suggestion.display_name}</div>;

  // Submit updated restaurant
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      alert("Please select a valid address from suggestions.");
      return;
    }

    const fd = new FormData();
    for (let key in formData) fd.append(key, formData[key]);
    if (panCardImage) fd.append("panCardImage", panCardImage);
    if (restaurantImage) fd.append("restaurantImage", restaurantImage);
    fd.append("address", address);
    fd.append("latitude", latitude);
    fd.append("longitude", longitude);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000"}/api/admin/restaurants/${id}`,
        fd,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Restaurant updated successfully!");
      navigate("/admin/restaurants");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update restaurant");
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Loading...</p>;

  return (
    <div className="min-h-screen bg-[#043927] flex items-center justify-center py-12 px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-3xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">✏️ Edit Restaurant</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <input type="text" name="name" placeholder="Restaurant Name" onChange={handleChange} value={formData.name} required className="input-field" />
          <input type="text" name="ownerName" placeholder="Owner Name" onChange={handleChange} value={formData.ownerName} required className="input-field" />
          <input type="text" name="mobile" placeholder="Mobile" onChange={handleChange} value={formData.mobile} required className="input-field" />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} value={formData.email} required className="input-field" />
          <input type="text" name="panCardNumber" placeholder="PAN Number" onChange={handleChange} value={formData.panCardNumber} required className="input-field" />
          <input type="file" name="panCardImage" onChange={(e) => setPanCardImage(e.target.files[0])} className="input-file" />
          <input type="file" name="restaurantImage" onChange={(e) => setRestaurantImage(e.target.files[0])} className="input-file" />
          <div className="sm:col-span-2">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={getSuggestionValue}
              renderSuggestion={renderSuggestion}
              onSuggestionSelected={onSuggestionSelected}
              inputProps={{ placeholder: "Address", value: address, onChange: onAddressChange, className: "input-field w-full" }}
            />
          </div>
          <input type="text" name="fssaiNumber" placeholder="FSSAI Number" onChange={handleChange} value={formData.fssaiNumber} required className="input-field" />
          <input type="text" name="bankAccountNumber" placeholder="Bank A/C Number" onChange={handleChange} value={formData.bankAccountNumber} required className="input-field" />
          <input type="text" name="ifscCode" placeholder="IFSC Code" onChange={handleChange} value={formData.ifscCode} required className="input-field" />
          <input type="text" name="upiId" placeholder="UPI ID" onChange={handleChange} value={formData.upiId} required className="input-field" />
          <div className="col-span-1 sm:col-span-2 text-center">
            <button type="submit" className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-300 font-bold">
              💾 Update Restaurant
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .input-field {
          background: rgba(255,255,255,0.1);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          border: 1px solid rgba(255,255,255,0.2);
          outline: none;
          width: 100%;
          transition: 0.3s;
        }
        .input-field:focus {
          border-color: #00A862;
          background: rgba(255,255,255,0.2);
          box-shadow: 0 0 0 3px rgba(0,168,98,0.3);
        }
        .input-file {
          background-color: white;
          padding: 0.5rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
};

export default EditRestaurant;
