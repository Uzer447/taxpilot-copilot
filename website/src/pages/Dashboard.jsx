import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Dashboard() {
  const [data, setData] = useState({ healthScore: 0, documentsCount: 0, pendingReviews: 0 });

  useEffect(() => {
    api.getDashboard().then(res => {
      if (res.success) setData(res.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Financial Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/history" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:scale-105 transition-transform cursor-pointer block">
          <h3 className="text-gray-500 font-medium mb-2">Health Score</h3>
          <p className="text-4xl font-bold text-emerald-600">{data.healthScore}<span className="text-lg text-gray-400">/100</span></p>
        </Link>
        <Link to="/documents" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:scale-105 transition-transform cursor-pointer block">
          <h3 className="text-gray-500 font-medium mb-2">Documents</h3>
          <p className="text-4xl font-bold text-gray-900">{data.documentsCount} <span className="text-lg text-gray-400">uploaded</span></p>
        </Link>
        <Link to="/history" className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:scale-105 transition-transform cursor-pointer block">
          <h3 className="text-gray-500 font-medium mb-2">Pending Reviews</h3>
          <p className="text-4xl font-bold text-amber-600">{data.pendingReviews} <span className="text-lg text-gray-400">action needed</span></p>
        </Link>
      </div>
    </div>
  );
}
