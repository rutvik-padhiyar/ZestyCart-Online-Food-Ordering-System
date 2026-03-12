import React, { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquareQuote, Send } from "lucide-react";
import SidebarLayout from "../../layouts/SidebarLayout";
import "../../styles/admin.css";

const BACKEND_URL = process.env["REACT_APP_BACKEND_URL"] || `${BACKEND_URL}`;

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [replyInputs, setReplyInputs] = useState({});

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const feedbackData = response.data.feedbacks || response.data || [];
      setFeedbacks(feedbackData);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyChange = (id, value) => {
    setReplyInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdateFeedback = async (id) => {
    const token = localStorage.getItem("token");
    if (!replyInputs[id]) return;

    try {
      setUpdatingId(id);
      await axios.put(
        `${BACKEND_URL}/api/feedback/${id}`,
        {
          status: "reviewed",
          reply: replyInputs[id],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchFeedbacks();
    } catch (error) {
      console.error("Failed to update feedback:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <section className="admin-glass rounded-[32px] px-6 py-6 text-white lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="admin-badge bg-white/10 text-amber-200">Feedback Center</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight lg:text-4xl">
                Customer feedback queue
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Review, reply aur mark feedback directly from the same CRM-style workspace.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Feedbacks</p>
              <p className="mt-2 text-lg font-semibold text-white">{feedbacks.length}</p>
            </div>
          </div>
        </section>

        <section className="admin-panel rounded-[30px] overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Feedback list
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">User feedbacks</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-sm text-slate-500">Loading feedbacks...</div>
          ) : (
            <div className="space-y-4 p-6">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                        <MessageSquareQuote size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">
                          {feedback.userId?.name || feedback.userId?._id || "Guest"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Rating {feedback.rating} / 5
                        </p>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                          {feedback.comment}
                        </p>
                      </div>
                    </div>

                    <span className="admin-badge bg-slate-100 text-slate-700">
                      {feedback.status || "new"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                    <textarea
                      rows="3"
                      className="w-full rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-400"
                      value={replyInputs[feedback._id] !== undefined ? replyInputs[feedback._id] : feedback.reply || ""}
                      onChange={(event) => handleReplyChange(feedback._id, event.target.value)}
                      placeholder="Write a professional admin reply..."
                    />
                    <button
                      type="button"
                      disabled={updatingId === feedback._id || !(replyInputs[feedback._id] !== undefined ? replyInputs[feedback._id] : feedback.reply || "").trim()}
                      onClick={() => handleUpdateFeedback(feedback._id)}
                      className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Send size={16} />
                      {updatingId === feedback._id ? "Updating..." : "Reply & Mark Reviewed"}
                    </button>
                  </div>
                </div>
              ))}

              {!feedbacks.length && (
                <div className="text-sm text-slate-500">No feedback found.</div>
              )}
            </div>
          )}
        </section>
      </div>
    </SidebarLayout>
  );
}
