// src/pages/BlogForm.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

export default function BlogForm() {
  const { id } = useParams(); // edit mode
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    image: "", // for existing image url
    author: "",
    excerpt: "",
    content: "",
    category: "General",
    status: "published",
  });
  const [file, setFile] = useState(null); // new file
  const [preview, setPreview] = useState("");

  // ✅ Load blog in edit mode
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/blogs/${id}`);
        const b = res.data.blog;
        setForm({
          title: b.title,
          image: b.image || "",
          author: b.author || "",
          excerpt: b.excerpt || "",
          content: b.content || "",
          category: b.category || "General",
          status: b.status || "published",
        });
        setPreview(b.image || "");
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [id]);

  // ✅ Handle file change
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) {
      setPreview(URL.createObjectURL(f)); // preview image
    }
  };

  // ✅ Submit handler
  const submit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("author", form.author);
      data.append("excerpt", form.excerpt);
      data.append("content", form.content);
      data.append("category", form.category);
      data.append("status", form.status);

      // agar nayi file dali hai to usko bhejo
      if (file) {
        data.append("image", file);
      } else if (form.image) {
        // agar edit mode hai aur purani image rakhni hai
        data.append("image", form.image);
      }

      if (id) {
        await axios.put(`${BACKEND_URL}/api/blogs/${id}`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/blogs`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      navigate("/admin/blogs");
    } catch (e) {
      console.error(e);
      alert("Save failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">
        {id ? "Edit Blog" : "Add Blog"}
      </h1>

      <form onSubmit={submit} className="space-y-4">
        {/* Title */}
        <input
          className="w-full border rounded-lg px-4 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* Preview */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-3 w-48 h-32 object-cover rounded-lg border"
            />
          )}
        </div>

        {/* Author / Category / Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="border rounded-lg px-4 py-2"
            placeholder="Author"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
          />
          <select
            className="border rounded-lg px-4 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option>General</option>
            <option>Food</option>
            <option>Recipes</option>
            <option>Events</option>
          </select>
          <select
            className="border rounded-lg px-4 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Excerpt */}
        <textarea
          className="w-full border rounded-lg px-4 py-2"
          placeholder="Short excerpt"
          rows={3}
          value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
        />

        {/* Content */}
        <textarea
          className="w-full border rounded-lg px-4 py-2 font-mono"
          placeholder="Full content (HTML allowed)"
          rows={12}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg"
          >
            {id ? "Update" : "Create"}
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-lg border"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
