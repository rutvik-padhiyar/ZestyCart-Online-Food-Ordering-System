// LiveRevenueChart.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import io from "socket.io-client";

// ✅ Hardcoded backend URL (no env used)
const BACKEND_URL = `${BACKEND_URL}`;
const socket = io(BACKEND_URL);

export default function LiveRevenueChart() {
  const [chartData, setChartData] = useState([]);

  const token = localStorage.getItem("token");

  const fetchChartData = async () => {
    try {
      if (!token) {
        console.error("❌ No token found in localStorage");
        return;
      }

      const res = await axios.get(`${BACKEND_URL}/api/admin/chart-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data && res.data.chartData) {
        setChartData(res.data.chartData);
      } else {
        console.error("❌ chartData not received correctly", res.data);
      }
    } catch (err) {
      console.error("❌ Failed to fetch chart data:", err);
    }
  };

  useEffect(() => {
    fetchChartData();

    socket.on("newOrder", () => {
      fetchChartData();
    });

    return () => {
      socket.off("newOrder");
    };
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-indigo-700 mb-4">
        📈 Revenue Over Time
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `₹${value}`} />
          <Tooltip formatter={(value) => `₹${value}`} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ r: 5 }}
            activeDot={{ r: 8 }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
