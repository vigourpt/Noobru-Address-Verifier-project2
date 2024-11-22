import React, { useState } from 'react';
import { Upload, RefreshCw, Search, FileText, Mail } from 'lucide-react';
import SingleAddressVerifier from './components/SingleAddressVerifier';
import CSVVerifier from './components/CSVVerifier';
import EmailComposer from './components/EmailComposer';

function App() {
  const [activeTab, setActiveTab] = useState<'single' | 'csv' | 'email'>('single');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Address Verifier</h1>
          <p className="text-gray-600">Verify and correct addresses worldwide</p>
        </header>

        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'single'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search size={20} />
                <span>Single Address</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'csv'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={20} />
                <span>CSV Batch Process</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-4 px-6 text-center font-medium ${
                activeTab === 'email'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail size={20} />
                <span>Email Composer</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'single' && <SingleAddressVerifier />}
            {activeTab === 'csv' && <CSVVerifier />}
            {activeTab === 'email' && <EmailComposer />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;