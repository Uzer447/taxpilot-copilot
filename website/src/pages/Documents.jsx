import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = () => {
    api.getDocuments().then(res => {
      if (res.success) setDocuments(res.documents);
    }).catch(console.error);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploading(true);
    try {
      await api.uploadDocument(formData);
      fetchDocs();
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteDocument(id);
      fetchDocs();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Documents</h2>
      
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center mb-8">
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your tax documents</h3>
        <p className="text-gray-500 mb-6">Upload Form 16, Salary Slips, or AIS to get personalized recommendations.</p>
        
        <label className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors cursor-pointer">
          {uploading ? 'Uploading...' : 'Browse Files'}
          <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Uploaded Documents</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
             <div className="p-6 text-center text-gray-500">No documents uploaded yet.</div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <p className="text-sm text-gray-500">Added on {new Date(doc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
