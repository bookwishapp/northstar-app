import { Order } from '@prisma/client';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

const POSTGRID_API_KEY = process.env.POSTGRID_API_KEY!;
const POSTGRID_API_URL = 'https://api.postgrid.com/v1';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface PostGridLetterRequest {
  to: {
    firstName: string;
    lastName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    provinceOrState: string;
    postalOrZip: string;
    country: string;
  };
  from: {
    firstName: string;
    lastName: string;
    organization: string;
    addressLine1: string;
    city: string;
    provinceOrState: string;
    postalOrZip: string;
    country: string;
  };
  file: string; // Base64 encoded PDF
  color: boolean;
  doubleSided: boolean;
  mergeVariables?: Record<string, any>;
  description?: string;
}

interface PostGridResponse {
  id: string;
  status: string;
  sendDate?: string;
  expectedDeliveryDate?: string;
  trackingEvents?: Array<{
    type: string;
    timestamp: string;
    description: string;
  }>;
}

export async function sendPhysicalLetter(order: Order): Promise<PostGridResponse> {
  if (!order.deliveryAddress) {
    throw new Error('No delivery address provided for physical order');
  }

  if (!order.letterPdfKey) {
    throw new Error('Letter PDF not generated yet');
  }

  // Fetch letter PDF from S3
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: order.letterPdfKey,
  });

  const s3Response = await s3Client.send(getObjectCommand);
  if (!s3Response.Body) {
    throw new Error('Failed to fetch PDF from S3');
  }

  // Convert stream to base64
  const chunks: Uint8Array[] = [];
  for await (const chunk of s3Response.Body as any) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const base64Pdf = buffer.toString('base64');

  // Parse delivery address from JSON
  const address = order.deliveryAddress as any;

  // Extract recipient name
  const recipientName = order.recipientName || 'Recipient';
  const nameParts = recipientName.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  // Extract address components from the JSON structure
  // Expected format: { line1, line2?, city, state, zip, country? }
  const streetAddress = address.line1 || '';
  const addressLine2 = address.line2 || undefined;
  const city = address.city || '';
  const state = address.state || '';
  const zip = address.zip || '';
  const country = address.country || 'US';

  // Prepare PostGrid API request
  const letterRequest: PostGridLetterRequest = {
    to: {
      firstName,
      lastName,
      addressLine1: streetAddress,
      addressLine2: addressLine2,
      city,
      provinceOrState: state,
      postalOrZip: zip,
      country: country === 'US' ? 'US' : country,
    },
    from: {
      firstName: 'North Star',
      lastName: 'Postal',
      organization: 'North Star Postal',
      addressLine1: '548 Market St #23008',
      city: 'San Francisco',
      provinceOrState: 'CA',
      postalOrZip: '94104',
      country: 'US',
    },
    file: base64Pdf,
    color: true,
    doubleSided: false,
    description: `Holiday letter for Order ${order.id}`,
  };

  // Send to PostGrid API
  const response = await fetch(`${POSTGRID_API_URL}/letters`, {
    method: 'POST',
    headers: {
      'x-api-key': POSTGRID_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(letterRequest),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('PostGrid API error:', errorData);
    throw new Error(`PostGrid API error: ${response.status} ${response.statusText}`);
  }

  const result: PostGridResponse = await response.json();
  return result;
}

export async function getLetterStatus(postgridId: string): Promise<PostGridResponse> {
  const response = await fetch(`${POSTGRID_API_URL}/letters/${postgridId}`, {
    method: 'GET',
    headers: {
      'x-api-key': POSTGRID_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch letter status: ${response.status}`);
  }

  return response.json();
}

// Webhook verification
export function verifyPostGridWebhook(
  payload: string,
  signature: string
): boolean {
  // PostGrid uses HMAC-SHA256 for webhook signatures
  // Implementation would depend on PostGrid's specific webhook security model
  // For now, we'll do basic API key verification in the webhook handler
  return true; // Placeholder - implement actual verification when PostGrid docs are available
}