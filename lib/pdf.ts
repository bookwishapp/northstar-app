import { prisma } from '@/lib/prisma';
import { renderWithGotenberg } from '@/lib/gotenberg';
import { uploadToS3, resolveTemplateAssets } from '@/lib/s3';

interface PdfKeys {
  letterKey: string;
  storyKey: string;
  envelopeKey: string | null;
}

/**
 * Get order with all necessary relations for PDF generation
 */
async function getOrderWithTemplate(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      program: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (!order.program || !order.program.template) {
    throw new Error(`Order ${orderId} missing program or template`);
  }

  if (!order.generatedLetter || !order.generatedStory) {
    throw new Error(`Order ${orderId} missing generated content`);
  }

  return order;
}

/**
 * Format recipient address from JSON object
 */
function formatRecipientAddress(recipientAddress: any): string {
  if (!recipientAddress) return '';

  const parts: string[] = [];

  if (recipientAddress.name) parts.push(recipientAddress.name);
  if (recipientAddress.line1) parts.push(recipientAddress.line1);
  if (recipientAddress.line2) parts.push(recipientAddress.line2);

  const cityStateLine: string[] = [];
  if (recipientAddress.city) cityStateLine.push(recipientAddress.city);
  if (recipientAddress.state) cityStateLine.push(recipientAddress.state);
  if (cityStateLine.length > 0 && recipientAddress.zip) {
    cityStateLine.push(recipientAddress.zip);
  }
  if (cityStateLine.length > 0) {
    parts.push(cityStateLine.join(', '));
  }

  if (recipientAddress.country) parts.push(recipientAddress.country);

  return parts.join('<br>');
}

/**
 * Build HTML for letter PDF
 */
function buildLetterHtml(
  order: any,
  assets: any,
  template: any
): string {
  // Split letter into paragraphs
  const paragraphs = order.generatedLetter
    .split('\n\n')
    .map((p: string) => p.replace(/\n/g, '<br>'));

  // If we have more than 3 paragraphs, wrap the last 2 paragraphs with signature
  // This ensures they stay together on the same page
  let letterContent = '';
  if (paragraphs.length > 3) {
    // All paragraphs except the last 2
    const mainParagraphs = paragraphs.slice(0, -2)
      .map((p: string) => `<p>${p}</p>`)
      .join('');

    // Last 2 paragraphs - will be kept with signature
    const lastParagraphs = paragraphs.slice(-2)
      .map((p: string) => `<p>${p}</p>`)
      .join('');

    letterContent = mainParagraphs + `<div class="keep-together">${lastParagraphs}`;
  } else {
    // If 3 or fewer paragraphs, wrap them all
    letterContent = `<div class="keep-together">` +
      paragraphs.map((p: string) => `<p>${p}</p>`).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="${template.fontUrl}" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: ${template.paperSize};
          margin: ${template.marginTop} ${template.marginRight} ${template.marginBottom} ${template.marginLeft};
        }

        body {
          font-family: '${template.fontFamily}', serif;
          color: ${template.primaryColor};
          font-size: 14px;
          line-height: 1.8;
          position: relative;
        }

        /* Background that spans full page */
        .page-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          ${assets.backgroundDataUri ? `
            background-image: url('${assets.backgroundDataUri}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          ` : ''}
        }

        /* Content flows naturally, no page wrapper */
        .content {
          position: relative;
          z-index: 1;
        }

        .header {
          text-align: center;
          margin-bottom: 3em;
          page-break-after: avoid;
        }

        .header img {
          max-width: 90%;
          max-height: 225px; /* Increased by 50% from 150px */
          width: auto;
          height: auto;
        }

        .letter-body {
          position: relative;
          z-index: 1;
        }

        .letter-body p {
          margin-bottom: 1.2em;
          text-align: justify;
          page-break-inside: avoid;
          orphans: 4;
          widows: 4;
        }

        /* Keep last content and signature together */
        .keep-together {
          page-break-inside: avoid;
          min-height: 200px; /* Ensures substantial content on last page */
        }

        .keep-together p {
          margin-bottom: 1.2em;
          text-align: justify;
        }

        .signature-section {
          margin-top: 3em;
          page-break-inside: avoid;
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          gap: 2em;
        }

        .signature-block {
          text-align: right;
        }

        .signature-block img {
          max-height: 150px; /* Increased by 50% from 100px */
          width: auto;
        }

        .signature-block p {
          font-size: 16px;
          font-style: italic;
        }

        /* Wax seal positioned next to signature */
        .wax-seal {
          flex-shrink: 0;
        }

        .wax-seal img {
          width: 120px; /* Increased by 50% from 80px */
          height: 120px;
        }
      </style>
    </head>
    <body>
      ${assets.backgroundDataUri ? '<div class="page-background"></div>' : ''}

      <div class="content">
        ${assets.headerDataUri ? `
          <div class="header">
            <img src="${assets.headerDataUri}" alt="">
          </div>
        ` : ''}

        <div class="letter-body">
          ${letterContent}

          <div class="signature-section">
          <div class="signature-block">
            ${assets.signatureDataUri ? `
              <img src="${assets.signatureDataUri}" alt="${template.character}">
            ` : `
              <p>${template.character}</p>
            `}
          </div>

          ${assets.waxSealDataUri && template.waxSealLastPageOnly !== false ? `
            <div class="wax-seal">
              <img src="${assets.waxSealDataUri}" alt="">
            </div>
          ` : ''}
        </div>
        </div> <!-- Close keep-together -->
      </div>
    </body>
    </html>
  `;
}

/**
 * Build HTML for story PDF
 */
function buildStoryHtml(
  order: any,
  assets: any,
  template: any
): string {
  // Clean up the story text - remove asterisks and other formatting artifacts
  const cleanedStory = order.generatedStory
    .replace(/\*+/g, '') // Remove asterisks
    .replace(/^#+\s*/gm, '') // Remove markdown headers
    .trim();

  const storyParagraphs = cleanedStory
    .split('\n\n')
    .map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const storyTitle = `${order.recipientName}'s ${template.character} Adventure`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="${template.fontUrl}" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: ${template.paperSize};
          margin: ${template.marginTop} ${template.marginRight} ${template.marginBottom} ${template.marginLeft};
        }

        body {
          font-family: '${template.fontFamily}', serif;
          color: ${template.primaryColor};
          font-size: 14pt;
          line-height: 1.8;
          position: relative;
        }

        /* Background that spans full page with opacity */
        .page-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: -1;
          ${assets.backgroundDataUri ? `
            background-image: url('${assets.backgroundDataUri}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.3;
          ` : ''}
        }

        /* Content flows naturally for proper page breaks */
        .content {
          position: relative;
          z-index: 1;
        }

        h1 {
          text-align: center;
          color: ${template.accentColor};
          margin-bottom: 2em;
          font-size: 24pt;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          page-break-after: avoid;
        }

        .story-body {
          position: relative;
          z-index: 1;
        }

        .story-body p {
          margin-bottom: 1.2em;
          text-align: justify;
          text-indent: 2em;
          page-break-inside: avoid;
          orphans: 4;
          widows: 4;
        }

        .story-body p:first-of-type {
          text-indent: 0;
        }

        .story-body p:first-of-type::first-letter {
          font-size: 3.5em;
          line-height: 0.8;
          float: left;
          margin-right: 0.05em;
          margin-top: -0.1em;
          color: ${template.accentColor};
          font-weight: bold;
        }

        /* Character image - right-aligned and 50% larger */
        .character-image {
          float: right;
          margin: 1em 0 1em 2em;
          clear: right;
        }

        .character-image img {
          max-width: 300px; /* Increased by 50% from 200px */
          max-height: 300px;
          width: auto;
          height: auto;
          opacity: 0.85;
          display: block;
        }

        .the-end {
          text-align: center;
          margin-top: 4em;
          font-size: 20pt;
          color: ${template.accentColor};
          font-style: italic;
          page-break-inside: avoid;
          clear: both;
        }
      </style>
    </head>
    <body>
      ${assets.backgroundDataUri ? '<div class="page-background"></div>' : ''}

      <div class="content">
        <h1>${storyTitle}</h1>

        ${assets.characterDataUri ? `
          <div class="character-image">
            <img src="${assets.characterDataUri}" alt="${template.character}">
          </div>
        ` : ''}

        <div class="story-body">
          ${storyParagraphs}
        </div>

        <div class="the-end">~ The End ~</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Build HTML for envelope PDF (digital orders only)
 */
function buildEnvelopeHtml(
  order: any,
  assets: any,
  template: any
): string {
  const returnAddress = template.returnAddress
    ? template.returnAddress.replace(/\n/g, '<br>')
    : `${template.character}<br>North Pole`;

  // Use the formatRecipientAddress function to get full address
  const formattedRecipientAddress = formatRecipientAddress(order.recipientAddress);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="${template.fontUrl}" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
          size: 9.5in 4.125in;
          margin: 0;
        }

        body {
          font-family: '${template.fontFamily}', serif;
          color: ${template.primaryColor};
          width: 9.5in;
          height: 4.125in;
          position: relative;
          overflow: hidden;
        }

        .envelope {
          width: 100%;
          height: 100%;
          position: relative;
          ${assets.envelopeBackgroundDataUri ? `
            background-image: url('${assets.envelopeBackgroundDataUri}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          ` : `
            background: linear-gradient(135deg, #f5f5dc 0%, #faf6f0 100%);
          `}
          border: 3px solid ${template.accentColor};
        }

        .recipient {
          position: absolute;
          left: 3.2in; /* Position in middle third of 9.5in envelope */
          top: 2.3in; /* Position closer to bottom of 4.125in envelope */
          text-align: left;
          font-size: 16pt;
          line-height: 1.5;
          z-index: 1;
        }

        .from {
          position: absolute;
          top: 0.5in;
          left: 0.5in;
          font-size: 12pt;
          color: ${template.accentColor};
        }
      </style>
    </head>
    <body>
      <div class="envelope">
        <div class="from">
          ${returnAddress}
        </div>

        <div class="recipient">
          ${formattedRecipientAddress || `<strong>${order.recipientName}</strong>`}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate all PDFs for an order
 */
export async function renderPdfs(orderId: string): Promise<PdfKeys> {
  console.log(`Rendering PDFs for order ${orderId}...`);

  const order = await getOrderWithTemplate(orderId);
  const { template } = order.program;

  // Fetch all template assets as data URIs
  console.log('Resolving template assets from S3...');
  const assets = await resolveTemplateAssets(template);

  // Generate letter PDF
  console.log('Generating letter PDF...');
  const letterHtml = buildLetterHtml(order, assets, template);
  const letterPdf = await renderWithGotenberg(letterHtml, {
    paperWidth: template.paperSize === 'a4' ? 8.27 : 8.5,
    paperHeight: template.paperSize === 'a4' ? 11.69 : 11,
    marginTop: template.marginTop,
    marginBottom: template.marginBottom,
    marginLeft: template.marginLeft,
    marginRight: template.marginRight,
  });
  const letterKey = await uploadToS3(
    letterPdf,
    `orders/${orderId}/letter.pdf`,
    'application/pdf'
  );
  console.log(`Letter PDF uploaded: ${letterKey}`);

  // Generate story PDF
  console.log('Generating story PDF...');
  const storyHtml = buildStoryHtml(order, assets, template);
  const storyPdf = await renderWithGotenberg(storyHtml, {
    paperWidth: template.paperSize === 'a4' ? 8.27 : 8.5,
    paperHeight: template.paperSize === 'a4' ? 11.69 : 11,
    marginTop: template.marginTop,
    marginBottom: template.marginBottom,
    marginLeft: template.marginLeft,
    marginRight: template.marginRight,
  });
  const storyKey = await uploadToS3(
    storyPdf,
    `orders/${orderId}/story.pdf`,
    'application/pdf'
  );
  console.log(`Story PDF uploaded: ${storyKey}`);

  // Generate envelope PDF for digital orders only
  let envelopeKey: string | null = null;
  if (order.deliveryType === 'digital') {
    console.log('Generating envelope PDF for digital order...');
    const envelopeHtml = buildEnvelopeHtml(order, assets, template);
    const envelopePdf = await renderWithGotenberg(envelopeHtml, {
      paperWidth: 9.5,
      paperHeight: 4.125,
      marginTop: '0',
      marginBottom: '0',
      marginLeft: '0',
      marginRight: '0',
    });
    envelopeKey = await uploadToS3(
      envelopePdf,
      `orders/${orderId}/envelope.pdf`,
      'application/pdf'
    );
    console.log(`Envelope PDF uploaded: ${envelopeKey}`);
  }

  console.log(`All PDFs rendered successfully for order ${orderId}`);

  return {
    letterKey,
    storyKey,
    envelopeKey,
  };
}

/**
 * Save PDF keys to order record
 */
export async function savePdfKeys(
  orderId: string,
  pdfKeys: PdfKeys
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      letterPdfKey: pdfKeys.letterKey,
      storyPdfKey: pdfKeys.storyKey,
      envelopePdfKey: pdfKeys.envelopeKey,
    },
  });
  console.log(`Saved PDF keys for order ${orderId}`);
}