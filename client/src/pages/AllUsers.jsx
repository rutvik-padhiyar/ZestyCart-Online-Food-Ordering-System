import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Shield, Trash2, UserRound } from "lucide-react";
import SidebarLayout from "../layouts/SidebarLayout";
import "../styles/admin.css";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000";

export default function AllUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((current) => current.filter((user) => user._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const summary = useMemo(() => {
    const customers = users.filter((user) => user.role === "user").length;
    const admins = users.filter((user) => user.role === "admin").length;
    const blocked = users.filter((user) => user.isBlocked).length;
    return { customers, admins, blocked };
  }, [users]);

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">User Management</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
                Customer and account directory
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Admin CRM style list with role visibility, blocked state aur quick remove actions.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <TopMetric label="Users" value={users.length} />
              <TopMetric label="Customers" value={summary.customers} />
              <TopMetric label="Blocked" value={summary.blocked} />
            </div>
          </div>
        </section>

        <section className="admin-panel rounded-[30px] overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Accounts
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">All users</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-sm text-slate-500">Loading users...</div>
          ) : error ? (
            <div className="px-6 py-12 text-sm text-rose-600">{error}</div>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full">
                <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.2em] text-slate-300">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-amber-50/40">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                            <UserRound size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{user.name}</p>
                            <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-700">
                        <span className="admin-badge bg-slate-100 text-slate-700">
                          <Shield size={14} />
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`admin-badge ${
                            user.isBlocked
                              ? "bg-rose-500/10 text-rose-700"
                              : "bg-emerald-500/10 text-emerald-700"
                          }`}
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => handleDelete(user._id)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
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

function TopMetric({ label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
