import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { BookText, Pencil, Plus, Trash2 } from "lucide-react";
import SidebarLayout from "../../layouts/SidebarLayout";
import "../../styles/admin.css";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/blogs?limit=100`);
      setBlogs(res.data.blogs || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this blog?")) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      load();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">Content Studio</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
                Manage blogs
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Create, update and remove blog posts from one place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/admin/blogs/new")}
              className="inline-flex items-center gap-2 rounded-[22px] bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              <Plus size={16} />
              Add Blog
            </button>
          </div>
        </section>

        <section className="admin-panel rounded-[30px] overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Blog records
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Manage blogs</h2>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full">
              <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.2em] text-slate-300">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {blogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-amber-50/40">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                          <BookText size={18} />
                        </div>
                        <div>
                          <Link
                            to={`/blogs/${blog.slug}`}
                            className="font-semibold text-slate-950"
                            target="_blank"
                          >
                            {blog.title}
                          </Link>
                          <p className="mt-1 text-sm text-slate-500">{blog.excerpt || "No excerpt"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-700">{blog.category || "-"}</td>
                    <td className="px-6 py-5 text-sm text-slate-700">{blog.author || "Admin"}</td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString("en-IN") : "-"}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/blogs/${blog._id}/edit`)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(blog._id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {blogs.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-sm text-slate-500" colSpan={5}>
                      No blogs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </SidebarLayout>
  );
}
