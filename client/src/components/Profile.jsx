import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Profile() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    age: "",
    image: null,
  });

  const getUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data);
      setFormData({
        name: data.name || "",
        email: data.email || "",
        mobile: data.mobile || "",
        address: data.address || "",
        age: data.age || "",
        image: null,
      });
      setImagePreview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (name === "image") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
      }
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) data.append(key, value);
    });

    try {
      await axios.put("/api/user/profile", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setEditMode(false);
      getUserProfile();
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return <div className="public-shell flex min-h-screen items-center justify-center text-slate-200">Loading...</div>;
  }

  return (
    <div className="public-shell">
      <div className="public-section pt-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="public-hero rounded-[36px] px-8 py-10 text-center text-white">
            <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-5xl font-semibold">
              {imagePreview || profile.profileImage ? (
                <img
                  src={imagePreview || profile.profileImage}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                profile?.name?.charAt(0) || "?"
              )}
            </div>
            <h1 className="mt-6 text-3xl font-semibold">{profile?.name}</h1>
            <p className="mt-2 text-sm text-emerald-100/75">{profile?.email}</p>
            <button type="button" onClick={() => setEditMode(true)} className="public-button public-button-primary mt-8 w-full">
              Edit Profile
            </button>
          </section>

          <section className="public-card rounded-[36px] p-8">
            {!editMode ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">Profile details</p>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <ProfileItem label="Mobile" value={profile?.mobile || "N/A"} />
                  <ProfileItem label="Address" value={profile?.address || "N/A"} />
                  <ProfileItem label="Age" value={profile?.age || "N/A"} />
                  <ProfileItem label="Status" value={profile?.isActive ? "Active" : "Inactive"} />
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdate} className="grid gap-4 md:grid-cols-2">
                <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className="public-input" />
                <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="public-input" />
                <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile" className="public-input" />
                <input name="age" value={formData.age} onChange={handleChange} placeholder="Age" className="public-input" />
                <div className="md:col-span-2">
                  <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="public-input" />
                </div>
                <div className="md:col-span-2">
                  <input name="image" type="file" onChange={handleChange} className="public-input" />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="public-button public-button-primary">Save</button>
                  <button type="button" onClick={() => setEditMode(false)} className="public-button public-button-secondary">Cancel</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
