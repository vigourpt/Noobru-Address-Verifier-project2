import React, { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { verifyAddress } from '../lib/openai';

const SingleAddressVerifier: React.FC = () => {
  const [inputAddress, setInputAddress] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyAddress(inputAddress);
      setVerifiedAddress(result);
    } catch (err) {
      setError('Failed to verify address. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setInputAddress('');
    setVerifiedAddress('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="input-address" className="block text-sm font-medium text-gray-700">
          Input Address
        </label>
        <textarea
          id="input-address"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter address to verify..."
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleVerify}
          disabled={isLoading || !inputAddress}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search size={20} />
          <span>{isLoading ? 'Verifying...' : 'Verify Address'}</span>
        </button>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <RefreshCw size={20} />
          <span>Reset</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="verified-address" className="block text-sm font-medium text-gray-700">
          Verified Address
        </label>
        <textarea
          id="verified-address"
          value={verifiedAddress}
          readOnly
          className="w-full h-32 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm"
          placeholder="Verified address will appear here..."
        />
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default SingleAddressVerifier;