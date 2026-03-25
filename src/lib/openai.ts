const NETLIFY_FUNCTION_URL = '/.netlify/functions/verify';

interface VerifiedAddress {
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  zone: string;
  postalCode: string;
  country: string;
  fullAddress: string;
}

async function callProxy<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(NETLIFY_FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Proxy error: ${response.status}`);
  }

  return response.json();
}

export const verifyAddress = async (address: string): Promise<VerifiedAddress> => {
  if (!address.trim()) {
    throw new Error('Address cannot be empty');
  }

  try {
    const result = await callProxy<{ content?: string; data?: { choices?: { message: { content: string } }[] } }>({
      address,
    });

    let verifiedAddress = JSON.parse(result.content || '{}');

    // Post-process to verify ranges if necessary
    if (verifiedAddress.country === "Australia" && !verifiedAddress.address1.includes('-')) {
      const inferredResponse = await callProxy<{ content?: string }>({
        address: verifiedAddress.address1,
      });

      const inferredRange = inferredResponse.content?.trim();
      if (inferredRange && inferredRange !== verifiedAddress.address1) {
        verifiedAddress.address1 = inferredRange;
      }
    }

    return verifiedAddress as VerifiedAddress;
  } catch (error) {
    console.error('Error verifying address:', error);
    // Return a structured response even on error
    return {
      address1: address,
      address2: '',
      address3: '',
      city: '',
      state: '',
      zone: '',
      postalCode: '',
      country: '',
      fullAddress: address
    };
  }
};

export const verifyAddressBatch = async (addresses: string[]): Promise<VerifiedAddress[]> => {
  try {
    const results = await callProxy<VerifiedAddress[]>({
      addresses,
    });
    return results;
  } catch (error) {
    console.error('Error verifying addresses:', error);
    throw new Error('Failed to verify addresses');
  }
};

export const generateEmailTemplate = async (
  originalAddress: string,
  verifiedAddress: string
): Promise<string> => {
  try {
    const result = await callProxy<{ content?: string }>({
      type: 'email',
      originalAddress,
      verifiedAddress,
    });

    return result.content || 'Failed to generate email template';
  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error('Failed to generate email template');
  }
};
