import sgMail from '@sendgrid/mail';

sgMail.setApiKey(import.meta.env.VITE_SENDGRID_API_KEY);

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

export const sendAddressVerificationEmail = async (
  toEmail: string,
  originalAddress: string,
  verifiedAddress: string,
  customTemplate?: string
): Promise<void> => {
  const template = customTemplate || DEFAULT_TEMPLATE;

  // For single address verification
  const msg = {
    to: toEmail,
    from: import.meta.env.VITE_FROM_EMAIL,
    subject: 'Please Confirm Your Updated Address',
    html: template
      .replace('{{customer_name}}', toEmail.split('@')[0]) // Basic personalization
      .replace('{{original_address}}', originalAddress)
      .replace('{{verified_address}}', verifiedAddress)
      .replace('{{confirmation_url}}', `${import.meta.env.VITE_APP_URL}/confirm-address?id=${Buffer.from(toEmail).toString('base64')}&status=correct`)
      .replace('{{correction_url}}', `${import.meta.env.VITE_APP_URL}/confirm-address?id=${Buffer.from(toEmail).toString('base64')}&status=incorrect`)
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

// For batch sending with SendGrid dynamic templates
export const sendBatchAddressVerificationEmails = async (
  addresses: Array<{
    email: string;
    originalAddress: string;
    verifiedAddress: string;
  }>
): Promise<void> => {
  const messages = addresses.map(({ email, originalAddress, verifiedAddress }) => ({
    to: email,
    from: import.meta.env.VITE_FROM_EMAIL,
    templateId: import.meta.env.VITE_SENDGRID_TEMPLATE_ID,
    dynamicTemplateData: {
      customer_name: email.split('@')[0],
      original_address: originalAddress,
      verified_address: verifiedAddress,
      confirmation_url: `${import.meta.env.VITE_APP_URL}/confirm-address?id=${Buffer.from(email).toString('base64')}&status=correct`,
      correction_url: `${import.meta.env.VITE_APP_URL}/confirm-address?id=${Buffer.from(email).toString('base64')}&status=incorrect`
    }
  }));

  try {
    await sgMail.send(messages);
  } catch (error) {
    console.error('Error sending batch emails:', error);
    throw new Error('Failed to send verification emails');
  }
};