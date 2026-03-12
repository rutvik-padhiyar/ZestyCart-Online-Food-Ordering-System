import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Pencil, Soup, Trash2 } from "lucide-react";
import SidebarLayout from "../layouts/SidebarLayout";
import "../styles/admin.css";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || `${BACKEND_URL}`;

export default function AllFoods() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/admin/foods`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFoods(res.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch foods. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/foods/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFoods((prev) => prev.filter((food) => food._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const summary = useMemo(() => {
    const avgPrice = foods.length
      ? Math.round(foods.reduce((sum, food) => sum + Number(food.price || 0), 0) / foods.length)
      : 0;
    return { total: foods.length, avgPrice };
  }, [foods]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">Food Catalog</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
                Menu inventory overview
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Premium admin table for all foods with price visibility, restaurant mapping aur edit-delete actions.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Items" value={summary.total} />
              <Metric label="Avg Price" value={`Rs ${summary.avgPrice}`} />
            </div>
          </div>
        </section>

        <section className="admin-panel rounded-[30px] overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Food items
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">All foods</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-sm text-slate-500">Loading foods...</div>
          ) : error ? (
            <div className="px-6 py-12 text-sm text-rose-600">{error}</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full">
                <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.2em] text-slate-300">
                  <tr>
                    <th className="px-6 py-4">Food</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Restaurant</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {foods.map((food) => (
                    <tr key={food._id} className="hover:bg-amber-50/40">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <Soup size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{food.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{food.description || "No description"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-950">Rs {food.price}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{food.category || "-"}</td>
                      <td className="px-6 py-5 text-sm text-slate-600">{food.restaurant?.name || "N/A"}</td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <Link
                            to={`/admin/edit-food/${food._id}`}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                          >
                            <Pencil size={16} />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(food._id)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </SidebarLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
