import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function History() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.getHistory().then(res => {
      if (res.success) setSessions(res.sessions);
    }).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Review History</h2>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No filing sessions found. Start a review using the TaxPilot extension.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map(session => (
              <div key={session.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Session: {new Date(session.createdAt).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-gray-500">Status: <span className="uppercase">{session.status}</span></p>
                  </div>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    {session.reviews.length} reviews
                  </span>
                </div>
                
                {session.reviews.length > 0 && (
                  <div className="pl-4 border-l-2 border-emerald-200 space-y-4 mt-4">
                    {session.reviews.map(review => (
                      <div key={review.id} className="bg-white border border-gray-100 p-4 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-emerald-800">{review.pageTitle}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            review.healthScore > 80 ? 'bg-green-100 text-green-800' :
                            review.healthScore > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            Score: {review.healthScore}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
