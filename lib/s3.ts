import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Lazy initialization of S3 client
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    // Validate required environment variables only when actually needed
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in Railway.');
    }

    s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

function getBucketName(): string {
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET not configured. Please set AWS_S3_BUCKET in Railway.');
  }
  return process.env.AWS_S3_BUCKET;
}

/**
 * Upload a file to S3
 * @param buffer - File content as Buffer
 * @param key - S3 key (path) for the file
 * @param contentType - MIME type of the file
 * @returns The S3 key of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await getS3Client().send(command);
  return key;
}

/**
 * Get a presigned URL for downloading a file from S3
 * @param key - S3 key of the file
 * @param expiresIn - URL expiration time in seconds (default: 24 hours)
 * @returns Presigned URL for downloading the file
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 86400 // 24 hours
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  return getSignedUrl(getS3Client(), command, { expiresIn });
}

/**
 * Download a file from S3 as a Buffer
 * @param key - S3 key of the file
 * @returns File content as Buffer
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });

  const response = await getS3Client().send(command);

  if (!response.Body) {
    throw new Error(`No content found for S3 key: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Convert an S3 key to a data URI for embedding in HTML
 * @param key - S3 key of the image
 * @returns Base64 data URI
 */
export async function getAssetAsDataUri(key: string | null): Promise<string | null> {
  if (!key) return null;

  try {
    const buffer = await downloadFromS3(key);
    const base64 = buffer.toString('base64');

    // Determine MIME type from extension
    const extension = key.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg'; // default

    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
    }

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to fetch asset from S3: ${key}`, error);
    return null;
  }
}

/**
 * Resolve all template assets to data URIs for PDF generation
 * @param template - Template object with S3 keys
 * @returns Object with data URIs for all assets
 */
export async function resolveTemplateAssets(template: {
  backgroundKey?: string | null;
  headerKey?: string | null;
  characterKey?: string | null;
  waxSealKey?: string | null;
  signatureKey?: string | null;
  envelopeBackgroundKey?: string | null;
}) {
  const [background, header, character, waxSeal, signature, envelopeBackground] = await Promise.all([
    getAssetAsDataUri(template.backgroundKey || null),
    getAssetAsDataUri(template.headerKey || null),
    getAssetAsDataUri(template.characterKey || null),
    getAssetAsDataUri(template.waxSealKey || null),
    getAssetAsDataUri(template.signatureKey || null),
    getAssetAsDataUri(template.envelopeBackgroundKey || null),
  ]);

  return {
    backgroundDataUri: background,
    headerDataUri: header,
    characterDataUri: character,
    waxSealDataUri: waxSeal,
    signatureDataUri: signature,
    envelopeBackgroundDataUri: envelopeBackground,
  };
}