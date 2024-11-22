import React, { useState, useEffect } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { generateEmailTemplate } from '../lib/openai';
import { sendAddressVerificationEmail } from '../lib/email';

const DEFAULT_TEMPLATE = `Dear {{customer_name}},

We've recently reviewed and verified your shipping address in our system. Please take a moment to confirm if the updated address is correct:

Original Address:
{{original_address}}

Verified Address:
{{verified_address}}

Please click one of the links below to confirm:
[Yes, this is correct] - {{confirmation_url}}
[No, this needs correction] - {{correction_url}}

If you have any questions or concerns, please don't hesitate to reach out to us.

Best regards,
Your Company Name`;

const EmailComposer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [originalAddress, setOriginalAddress] = useState('');
  const [verifiedAddress, setVerifiedAddress] = useState('');
  const [emailTemplate, setEmailTemplate] = useState(DEFAULT_TEMPLATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const template = await generateEmailTemplate(originalAddress, verifiedAddress);
      setEmailTemplate(template);
    } catch (err) {
      setError('Failed to generate email template. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    setError(null);
    try {
      await sendAddressVerificationEmail(email, originalAddress, verifiedAddress, emailTemplate);
      setEmail('');
      setOriginalAddress('');
      setVerifiedAddress('');
      setEmailTemplate(DEFAULT_TEMPLATE);
    } catch (err) {
      setError('Failed to send email. Please try again.');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setEmail('');
    setOriginalAddress('');
    setVerifiedAddress('');
    setEmailTemplate(DEFAULT_TEMPLATE);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsBatchMode(!isBatchMode)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isBatchMode ? 'Switch to Single Email' : 'Switch to Batch Mode'}
        </button>
      </div>

      <div className="space-y-4">
        {!isBatchMode && (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Recipient Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="recipient@example.com"
            />
          </div>
        )}

        <div>
          <label htmlFor="original-address" className="block text-sm font-medium text-gray-700">
            Original Address {isBatchMode && '{{original_address}}'}
          </label>
          <textarea
            id="original-address"
            value={originalAddress}
            onChange={(e) => setOriginalAddress(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder={isBatchMode ? "Will be replaced with SendGrid template tag" : "Enter original address..."}
            readOnly={isBatchMode}
          />
        </div>

        <div>
          <label htmlFor="verified-address" className="block text-sm font-medium text-gray-700">
            Verified Address {isBatchMode && '{{verified_address}}'}
          </label>
          <textarea
            id="verified-address"
            value={verifiedAddress}
            onChange={(e) => setVerifiedAddress(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder={isBatchMode ? "Will be replaced with SendGrid template tag" : "Enter verified address..."}
            readOnly={isBatchMode}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="email-template" className="block text-sm font-medium text-gray-700">
              Email Template
            </label>
            {!isBatchMode && (
              <button
                onClick={handleGenerateTemplate}
                disabled={isGenerating || !originalAddress || !verifiedAddress}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                Generate Template
              </button>
            )}
          </div>
          <textarea
            id="email-template"
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            rows={12}
            placeholder="Email template with SendGrid tags..."
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSendEmail}
          disabled={isSending || (!email && !isBatchMode) || !emailTemplate}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          <Send size={20} />
          <span>{isSending ? 'Sending...' : 'Send Email'}</span>
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

      {(isGenerating || isSending) && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default EmailComposer;