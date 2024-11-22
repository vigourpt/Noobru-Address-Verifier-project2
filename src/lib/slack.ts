import emailjs from '@emailjs/browser';

// Browser-friendly implementation for sending files via email
export const sendToSlackChannel = async (fileBlob: Blob, filename: string): Promise<void> => {
  try {
    // Convert Blob to Base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64data = reader.result?.toString().split(',')[1];
        resolve(base64data || '');
      };
    });
    reader.readAsDataURL(fileBlob);
    const base64File = await base64Promise;

    // Initialize EmailJS
    emailjs.init({
      publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      privateKey: import.meta.env.VITE_EMAILJS_PRIVATE_KEY,
    });

    // Send email with file as base64 attachment
    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      {
        to_email: 'address-verification-aaaaovtxhoujbyemzh2xzcnlvi@noobru.slack.com',
        subject: 'New Verified Addresses',
        message: 'New batch of verified addresses is attached.',
        attachment: base64File,
        filename: filename
      }
    );

    return Promise.resolve();
  } catch (error) {
    console.error('Error sending to Slack:', error);
    throw new Error('Failed to send to Slack channel');
  }
};