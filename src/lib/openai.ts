import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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

export const verifyAddress = async (address: string): Promise<VerifiedAddress> => {
  if (!address.trim()) {
    throw new Error('Address cannot be empty');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an address verification expert. Given an address, verify, correct, and complete it to its proper format based on country-specific rules.
Format your response as a JSON object with these exact fields:
{
  "address1": "primary address line",
  "address2": "secondary address line or empty string",
  "address3": "tertiary address line or empty string",
  "city": "verified city/suburb/locality",
  "state": "state/county/region",
  "zone": "zone if applicable or empty string",
  "postalCode": "postal code or 0000 if none",
  "country": "full country name",
  "fullAddress": "complete formatted address"
}

Country-specific rules:

Australia:
- State: Use territory abbreviation (NSW, VIC, QLD, etc.)
- Postcode: 4 digits
- Unit/Apt Format: 
  * For unit numbers: "Unit #/##" or "U #/##" (maintain original format)
  * For street ranges: If a property spans multiple street numbers, use hyphen (e.g., 92-94)
  * Example: "Unit 1/92-94 Sturgeon St, Ormiston QLD 4160"
- City: Use the most accurate suburb/locality name based on the postal address
- Include building/complex names if they exist

United Kingdom:
- County: Include if applicable
- Postcode: Standard UK format
- Example: "123 High Street, Manchester, Greater Manchester M1 1AA"

United States:
- State: Two-letter abbreviation
- ZIP Code: 5 digits or ZIP+4
- Example: "123 Main St, Boston, MA 02108"

United Arab Emirates:
- No postcodes (use 0000)
- Include Emirate
- Example: "Villa 12, Street 7B, Al Wasl, Dubai 0000, UAE"

Hong Kong:
- No postcodes (use 0000)
- Include District
- Example: "Flat 12A, Tower 1, Pacific Place, 88 Queensway, Central, Hong Kong 0000"

General Rules:
1. Always include appropriate regional division (state/county/emirate/district)
2. For countries without postcodes, use 0000
3. Maintain local address format conventions
4. Include full country name
5. Keep abbreviations consistent with local standards
6. Preserve street number ranges when they exist (e.g., 92-94)
7. Use the most accurate locality/suburb name based on postal addressing

RESPOND ONLY WITH THE JSON OBJECT, NO OTHER TEXT.`
        },
        {
          role: "user",
          content: `Verify and correct this address: ${address}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    try {
      const verifiedAddress = JSON.parse(response.choices[0].message.content || '{}');
      return verifiedAddress as VerifiedAddress;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      // Fallback structure if parsing fails
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
    // Process addresses one at a time to ensure reliability
    const verifiedAddresses = await Promise.all(
      addresses.map(async (address) => {
        try {
          return await verifyAddress(address);
        } catch (error) {
          console.error(`Error verifying address: ${address}`, error);
          // Return a default structure if verification fails
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
      })
    );

    return verifiedAddresses;
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at writing professional, friendly email communications. Create a polite email template for address verification."
        },
        {
          role: "user",
          content: `Generate a professional email template to notify a customer about an address update. Original address: "${originalAddress}", Verified address: "${verifiedAddress}". The email should be friendly, clear, and ask for their confirmation.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content || 'Failed to generate email template';
  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error('Failed to generate email template');
  }
};