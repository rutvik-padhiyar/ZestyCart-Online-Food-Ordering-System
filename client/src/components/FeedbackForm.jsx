import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

const stars = [1, 2, 3, 4, 5];

const FeedbackForm = ({ onSubmitSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("Please login first to submit feedback.");
    if (rating === 0 || comment.trim() === "")
      return alert("Please provide rating and comment.");

    setLoading(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/feedback`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to submit feedback. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Cancel button */}
      
      <form onSubmit={handleSubmit}>
        {/* Stars */}
        <div className="flex justify-center gap-2 mb-4">
          {stars.map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl ${
                rating >= star ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows="3"
          placeholder="Write your feedback here..."
          className="w-full border border-gray-300 rounded-md px-4 py-3 mb-4 resize-y focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-md text-white font-semibold shadow-md transition ${
            loading
              ? "bg-orange-300 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          {loading ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
