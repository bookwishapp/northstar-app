import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { getPresignedDownloadUrl } from '@/lib/s3';
import { prisma } from '@/lib/prisma';

// Initialize SES client - using Railway environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in Railway.');
}

if (!process.env.FROM_EMAIL) {
  throw new Error('FROM_EMAIL not configured. Please set FROM_EMAIL in Railway.');
}

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL;
const FROM_NAME = process.env.FROM_NAME || 'North Star Postal';

interface PdfKeys {
  letterKey: string;
  storyKey: string;
  envelopeKey: string | null;
}

/**
 * Send claim email when admin creates an order
 */
export async function sendClaimEmail(order: any): Promise<void> {
  if (!order.customerEmail) {
    throw new Error('Customer email is required to send claim email');
  }

  const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/claim/${order.claimToken}`;

  // Get the template character for personalization
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      program: {
        include: {
          template: true,
        },
      },
    },
  });

  const character = fullOrder?.program?.template?.character || 'Santa Claus';
  const holidayName = getHolidayName(order.holidaySlug);

  const subject = `🎄 Your ${holidayName} Letter is Waiting to be Personalized!`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          color: #2c1810;
          background-color: #faf6f0;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #8b0000 0%, #d2001f 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          color: #8b0000;
          margin-bottom: 20px;
        }
        .message {
          margin-bottom: 20px;
        }
        .cta-button {
          display: inline-block;
          background: #d2001f;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-size: 18px;
          font-weight: bold;
          margin: 20px 0;
          box-shadow: 0 3px 6px rgba(0,0,0,0.2);
        }
        .cta-button:hover {
          background: #8b0000;
        }
        .steps {
          background: #f5f5dc;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .steps h3 {
          color: #8b0000;
          margin-top: 0;
        }
        .steps ol {
          margin: 10px 0;
          padding-left: 20px;
        }
        .steps li {
          margin: 10px 0;
        }
        .footer {
          background: #2c1810;
          color: #faf6f0;
          padding: 20px;
          text-align: center;
          font-size: 14px;
        }
        .url-fallback {
          word-break: break-all;
          color: #666;
          font-size: 12px;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>North Star Postal</h1>
          <p>Magical Letters from ${character}</p>
        </div>

        <div class="content">
          <div class="greeting">Your magical letter is ready to be personalized!</div>

          <div class="message">
            <p>Thank you for your order! ${character} is excited to write a personalized letter for your special someone.</p>

            <p>To make this letter truly magical, we need you to tell us a bit about the recipient. This will help ${character} create a one-of-a-kind letter that will bring joy and wonder!</p>
          </div>

          <div style="text-align: center;">
            <a href="${claimUrl}" class="cta-button">Personalize Your Letter Now</a>
            <div class="url-fallback">
              Or copy this link: ${claimUrl}
            </div>
          </div>

          <div class="steps">
            <h3>How it works:</h3>
            <ol>
              <li><strong>Click the button above</strong> to access your personalization form</li>
              <li><strong>Tell us about the recipient</strong> - their name, age, and special details</li>
              <li><strong>Submit the form</strong> and ${character} will craft a magical letter just for them</li>
              <li><strong>Receive your letter</strong> - We'll email you the personalized PDFs within minutes!</li>
            </ol>
          </div>

          <p><strong>Order Details:</strong></p>
          <ul>
            <li>Program: ${fullOrder?.program?.name}</li>
            <li>Delivery: ${order.deliveryType === 'digital' ? '📧 Digital (PDF via email)' : '📬 Physical (printed and mailed)'}</li>
            <li>Order ID: ${order.id}</li>
          </ul>

          <p style="color: #8b0000; font-weight: bold;">
            ⏰ Please personalize your letter within 7 days to ensure timely delivery!
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} North Star Postal | Spreading holiday magic, one letter at a time</p>
          <p>Questions? Reply to this email and we'll help right away!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Your ${holidayName} Letter is Waiting to be Personalized!

Thank you for your order! ${character} is excited to write a personalized letter for your special someone.

Click here to personalize your letter: ${claimUrl}

How it works:
1. Click the link above to access your personalization form
2. Tell us about the recipient - their name, age, and special details
3. Submit the form and ${character} will craft a magical letter just for them
4. Receive your letter - We'll email you the personalized PDFs within minutes!

Order Details:
- Program: ${fullOrder?.program?.name}
- Delivery: ${order.deliveryType === 'digital' ? 'Digital (PDF via email)' : 'Physical (printed and mailed)'}
- Order ID: ${order.id}

Please personalize your letter within 7 days to ensure timely delivery!

© ${new Date().getFullYear()} North Star Postal
Questions? Reply to this email and we'll help right away!
  `;

  const command = new SendEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: {
      ToAddresses: [order.customerEmail],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
        Text: {
          Charset: 'UTF-8',
          Data: textBody,
        },
      },
    },
  });

  try {
    console.log(`Attempting to send claim email from ${FROM_EMAIL} to ${order.customerEmail}`);
    const result = await ses.send(command);
    console.log(`Claim email sent successfully to ${order.customerEmail} for order ${order.id}`);
    console.log(`SES MessageId: ${result.MessageId}`);
    return;
  } catch (error) {
    console.error('Failed to send claim email:', error);
    console.error('SES Configuration:', {
      region: process.env.AWS_REGION,
      fromEmail: FROM_EMAIL,
      toEmail: order.customerEmail,
      hasAccessKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
    });

    // Check for common SES errors
    if (error instanceof Error) {
      if (error.message.includes('MessageRejected')) {
        console.error('Email address may not be verified in AWS SES');
      } else if (error.message.includes('AccessDenied')) {
        console.error('AWS credentials may be incorrect or lack SES permissions');
      } else if (error.message.includes('Email address is not verified')) {
        console.error('Sender email address is not verified in AWS SES. Verify:', FROM_EMAIL);
      }
    }

    throw new Error(`Failed to send claim email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Send delivery email with PDF attachments (digital orders only)
 */
export async function sendDeliveryEmail(order: any, pdfS3Keys: PdfKeys): Promise<void> {
  if (!order.customerEmail) {
    throw new Error('Customer email is required to send delivery email');
  }

  if (order.deliveryType !== 'digital') {
    console.log('Skipping delivery email for physical order');
    return;
  }

  // Get the full order with template info
  const fullOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      program: {
        include: {
          template: true,
        },
      },
    },
  });

  const character = fullOrder?.program?.template?.character || 'Santa Claus';
  const holidayName = getHolidayName(order.holidaySlug);

  // Generate presigned URLs for PDFs (24 hour expiry)
  const [letterUrl, storyUrl, envelopeUrl] = await Promise.all([
    getPresignedDownloadUrl(pdfS3Keys.letterKey, 86400),
    getPresignedDownloadUrl(pdfS3Keys.storyKey, 86400),
    pdfS3Keys.envelopeKey ? getPresignedDownloadUrl(pdfS3Keys.envelopeKey, 86400) : Promise.resolve(null),
  ]);

  const subject = `${order.recipientName}'s ${holidayName} Letter Has Arrived!`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          color: #2c1810;
          background-color: #faf6f0;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #8b0000 0%, #d2001f 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .content {
          padding: 40px 30px;
        }
        .greeting {
          font-size: 20px;
          color: #8b0000;
          margin-bottom: 20px;
        }
        .pdf-section {
          background: #f5f5dc;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .pdf-item {
          margin: 15px 0;
          padding: 15px;
          background: white;
          border-radius: 5px;
          border-left: 4px solid #8b0000;
        }
        .pdf-item h3 {
          margin: 0 0 10px 0;
          color: #8b0000;
        }
        .download-button {
          display: inline-block;
          background: #d2001f;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          font-size: 14px;
          font-weight: bold;
        }
        .download-button:hover {
          background: #8b0000;
        }
        .instructions {
          background: #fff8dc;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .instructions h3 {
          color: #8b0000;
          margin-top: 0;
        }
        .footer {
          background: #2c1810;
          color: #faf6f0;
          padding: 20px;
          text-align: center;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Magical Letter Has Arrived!</h1>
          <p>From ${character} with Love</p>
        </div>

        <div class="content">
          <div class="greeting">Dear ${order.customerName || 'Friend'},</div>

          <p>
            Wonderful news! ${character} has finished writing a personalized letter for <strong>${order.recipientName}</strong>!
          </p>

          <p>
            We've included three magical PDFs for you to download and enjoy:
          </p>

          <div class="pdf-section">
            <div class="pdf-item">
              <h3>The Letter from ${character}</h3>
              <p>A personalized letter filled with magic and wonder, written just for ${order.recipientName}.</p>
              <a href="${letterUrl}" class="download-button">Download Letter</a>
            </div>

            <div class="pdf-item">
              <h3>${order.recipientName}'s Magical Story</h3>
              <p>An enchanting story featuring ${order.recipientName} as the hero!</p>
              <a href="${storyUrl}" class="download-button">Download Story</a>
            </div>

            ${envelopeUrl ? `
              <div class="pdf-item">
                <h3>Special Delivery Envelope</h3>
                <p>A decorative envelope to complete the magical experience!</p>
                <a href="${envelopeUrl}" class="download-button">Download Envelope</a>
              </div>
            ` : ''}
          </div>

          <div class="instructions">
            <h3>How to Create the Magic:</h3>
            <ol>
              <li><strong>Download all PDFs</strong> using the buttons above (links expire in 24 hours)</li>
              <li><strong>Print on quality paper</strong> for the best experience</li>
              <li><strong>Place the letter in the envelope</strong> for an authentic surprise</li>
              <li><strong>Hide it somewhere special</strong> for ${order.recipientName} to discover!</li>
              <li><strong>Watch their face light up</strong> with joy and wonder!</li>
            </ol>
          </div>

          <p style="text-align: center; color: #8b0000; font-size: 18px; margin: 30px 0;">
            <em>Thank you for letting us be part of your holiday magic!</em>
          </p>

          ${order.emailConsent ? `
            <p style="font-size: 12px; color: #666;">
              You're subscribed to receive occasional updates about new holiday programs and special offers.
              You can unsubscribe at any time.
            </p>
          ` : ''}
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} North Star Postal | Creating magical moments</p>
          <p>Download links expire in 24 hours. Save your PDFs to keep them forever!</p>
          <p>Questions? Reply to this email for support.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
Your Magical Letter Has Arrived!

Dear ${order.customerName || 'Friend'},

Wonderful news! ${character} has finished writing a personalized letter for ${order.recipientName}!

Download your PDFs here (links expire in 24 hours):

📜 Letter from ${character}: ${letterUrl}

📖 ${order.recipientName}'s Magical Story: ${storyUrl}

${envelopeUrl ? `✉️ Special Delivery Envelope: ${envelopeUrl}` : ''}

How to Create the Magic:
1. Download all PDFs using the links above
2. Print on quality paper for the best experience
3. Place the letter in the envelope for an authentic surprise
4. Hide it somewhere special for ${order.recipientName} to discover!
5. Watch their face light up with joy and wonder!

Thank you for letting us be part of your holiday magic!

© ${new Date().getFullYear()} North Star Postal
Download links expire in 24 hours. Save your PDFs to keep them forever!
Questions? Reply to this email for support.
  `;

  const command = new SendEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: {
      ToAddresses: [order.customerEmail],
    },
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: htmlBody,
        },
        Text: {
          Charset: 'UTF-8',
          Data: textBody,
        },
      },
    },
  });

  try {
    await ses.send(command);
    console.log(`Delivery email sent to ${order.customerEmail} for order ${order.id}`);

    // Save customer email for future marketing if they consented
    if (order.emailConsent) {
      console.log(`Customer ${order.customerEmail} opted in for email list`);
      // When Listmonk is integrated, it will use this same database
    }
  } catch (error) {
    console.error('Failed to send delivery email:', error);
    throw new Error(`Failed to send delivery email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to get friendly holiday name
 */
function getHolidayName(holidaySlug: string): string {
  const holidays: Record<string, string> = {
    christmas: 'Christmas',
    easter: 'Easter',
    birthday: 'Birthday',
    valentine: "Valentine's Day",
    halloween: 'Halloween',
    stpatrick: "St. Patrick's Day",
  };
  return holidays[holidaySlug] || 'Holiday';
}