import type { Handler, HandlerEvent } from '@netlify/functions';

const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Parse request body
  let body: { address?: string; addresses?: string[]; type?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OpenAI API key not configured' }),
    };
  }

  try {
    // Route to appropriate OpenAI endpoint
    let openAIResponse: Response;

    if (body.type === 'email') {
      // Email template generation
      const { originalAddress, verifiedAddress } = body;
      openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at writing professional, friendly email communications. Create a polite email template for address verification.',
            },
            {
              role: 'user',
              content: `Generate a professional email template to notify a customer about an address update. Original address: "${originalAddress}", Verified address: "${verifiedAddress}". The email should be friendly, clear, and ask for their confirmation.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
    } else if (body.address) {
      // Single address verification
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
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
  * For unit numbers: Convert to "U # ##" format, replacing "/" with a space
  * For street ranges: If the input contains only a single number but the address is known to span multiple numbers (e.g., 92-94), use a hyphen (e.g., "92-94 Sturgeon St"). Use your expertise and available information to determine if the address should include a range. If unsure, return the address as-is without assuming a range.
  * Example Input: "92 Sturgeon St, Ormiston QLD 4160"
  * Example Output: "92-94 Sturgeon St, Ormiston QLD 4160" (if a range is confirmed for this address)
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

RESPOND ONLY WITH THE JSON OBJECT, NO OTHER TEXT.`,
            },
            {
              role: 'user',
              content: `Verify and correct this address: ${body.address}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });
    } else if (body.addresses) {
      // Batch address verification - process one at a time
      const results = [];
      for (const address of body.addresses) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
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
  * For unit numbers: Convert to "U # ##" format, replacing "/" with a space
  * For street ranges: If the input contains only a single number but the address is known to span multiple numbers (e.g., 92-94), use a hyphen (e.g., "92-94 Sturgeon St"). Use your expertise and available information to determine if the address should include a range. If unsure, return the address as-is without assuming a range.
  * Example Input: "92 Sturgeon St, Ormiston QLD 4160"
  * Example Output: "92-94 Sturgeon St, Ormiston QLD 4160" (if a range is confirmed for this address)
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

RESPOND ONLY WITH THE JSON OBJECT, NO OTHER TEXT.`,
              },
              {
                role: 'user',
                content: `Verify and correct this address: ${address}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            results.push(JSON.parse(content));
          } catch {
            results.push({ address1: address, address2: '', address3: '', city: '', state: '', zone: '', postalCode: '', country: '', fullAddress: address });
          }
        } else {
          results.push({ address1: address, address2: '', address3: '', city: '', state: '', zone: '', postalCode: '', country: '', fullAddress: address });
        }
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing address, addresses, or type field' }),
      };
    }

    const data = await openAIResponse.json();
    const content = data.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, data }),
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };