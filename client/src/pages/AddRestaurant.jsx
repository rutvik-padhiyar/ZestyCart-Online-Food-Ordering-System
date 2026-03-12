// src/pages/AddRestaurant.jsx
import React, { useState } from "react";
import axios from "axios";
import Autosuggest from "react-autosuggest";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";


const AddRestaurant = () => {
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

  // Handle text input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle address change for autocomplete
  const onAddressChange = (event, { newValue }) => {
    setAddress(newValue);
  };

  // Fetch suggestions from Nominatim API
  const onSuggestionsFetchRequested = async ({ value }) => {
    if (!value) return setSuggestions([]);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${value}`
      );
      setSuggestions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  const onSuggestionsClearRequested = () => {
    setSuggestions([]);
  };

  // When user selects a suggestion
  const onSuggestionSelected = (event, { suggestion }) => {
    setAddress(suggestion.display_name);
    setLatitude(suggestion.lat);
    setLongitude(suggestion.lon);
  };

  const getSuggestionValue = (suggestion) => suggestion.display_name;
  const renderSuggestion = (suggestion) => (
    <div>{suggestion.display_name}</div>
  );

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      alert("Please select a valid address from suggestions.");
      return;
    }

    const fd = new FormData();
    for (let key in formData) {
      fd.append(key, formData[key]);
    }
    fd.append("panCardImage", panCardImage);
    fd.append("restaurantImage", restaurantImage);

    fd.append("address", address);
    fd.append("latitude", latitude);
    fd.append("longitude", longitude);

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/restaurant/add`,
        fd
      );
      alert("✅ Restaurant added successfully!");
      setFormData({
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
      setAddress("");
      setLatitude(null);
      setLongitude(null);
      setPanCardImage(null);
      setRestaurantImage(null);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add restaurant");
    }
  };

  return (
    <div className="min-h-screen bg-[#043927] flex items-center justify-center py-12 px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-3xl shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-white/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          🏪 Add New Restaurant
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
        >
          {/* Basic Inputs */}
          <input
            type="text"
            name="name"
            placeholder="Restaurant Name"
            onChange={handleChange}
            value={formData.name}
            required
            className="input-field"
          />
          <input
            type="text"
            name="ownerName"
            placeholder="Owner Name"
            onChange={handleChange}
            value={formData.ownerName}
            required
            className="input-field"
          />
          <input
            type="text"
            name="mobile"
            placeholder="Mobile"
            onChange={handleChange}
            value={formData.mobile}
            required
            className="input-field"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            value={formData.email}
            required
            className="input-field"
          />
          <input
            type="text"
            name="panCardNumber"
            placeholder="PAN Number"
            onChange={handleChange}
            value={formData.panCardNumber}
            required
            className="input-field"
          />
          <input
            type="file"
            name="panCardImage"
            onChange={(e) => setPanCardImage(e.target.files[0])}
            required
            className="input-file"
          />
          <input
            type="file"
            name="restaurantImage"
            onChange={(e) => setRestaurantImage(e.target.files[0])}
            required
            className="input-file"
          />

          {/* Address with autocomplete */}
          <div className="sm:col-span-2">
            <Autosuggest
              suggestions={suggestions}
              onSuggestionsFetchRequested={onSuggestionsFetchRequested}
              onSuggestionsClearRequested={onSuggestionsClearRequested}
              getSuggestionValue={getSuggestionValue}
              renderSuggestion={renderSuggestion}
              onSuggestionSelected={onSuggestionSelected}
              inputProps={{
                placeholder: "Address",
                value: address,
                onChange: onAddressChange,
                className: "input-field w-full",
              }}
            />
          </div>

          {/* Other Inputs */}
          <input
            type="text"
            name="fssaiNumber"
            placeholder="FSSAI Number"
            onChange={handleChange}
            value={formData.fssaiNumber}
            required
            className="input-field"
          />
          <input
            type="text"
            name="bankAccountNumber"
            placeholder="Bank A/C Number"
            onChange={handleChange}
            value={formData.bankAccountNumber}
            required
            className="input-field"
          />
          <input
            type="text"
            name="ifscCode"
            placeholder="IFSC Code"
            onChange={handleChange}
            value={formData.ifscCode}
            required
            className="input-field"
          />
          <input
            type="text"
            name="upiId"
            placeholder="UPI ID"
            onChange={handleChange}
            value={formData.upiId}
            required
            className="input-field"
          />

          {/* Submit Button */}
          <div className="col-span-1 sm:col-span-2 text-center">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg hover:scale-105 transition-all duration-300 font-bold"
            >
              ➕ Add Restaurant
            </button>
          </div>
        </form>
      </div>

      {/* Tailwind custom styles */}
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

export default AddRestaurant;
