// src/components/UserFeedbackReplies.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";


const UserFeedbackReplies = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const emojiMap = { 1: "😡", 2: "😕", 3: "😐", 4: "🙂", 5: "😍" };

  useEffect(() => {
    const fetchUserFeedbacks = async () => {
      try {
        const { data } = await axios.get(`${process.env["REACT_APP_BACKEND_URL"] || "http://localhost:5000"}/api/feedback/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFeedbacks(data);
      } catch (error) {
        console.error("Error fetching user feedbacks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserFeedbacks();
  }, [token]);

  if (loading) return <p>Loading your feedbacks...</p>;
  if (feedbacks.length === 0) return <p>You have not submitted any feedback yet.</p>;

  return (
    <div className="mt-4 p-4 border rounded-md bg-gray-50 max-h-56 overflow-y-auto">
      {feedbacks.map((fb) => (
        <div key={fb._id} className="mb-4 p-3 bg-white rounded shadow">
          <p className="text-2xl">{emojiMap[fb.rating]} <span className="text-gray-600">({fb.rating}/5)</span></p>
          <p className="mt-1"><strong>Your Comment:</strong> {fb.comment}</p>
          {fb.reply ? (
            <p className="mt-2 text-green-700"><strong>Admin Reply:</strong> {fb.reply}</p>
          ) : (
            <p className="mt-2 text-gray-500"><em>No reply yet</em></p>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserFeedbackReplies;
