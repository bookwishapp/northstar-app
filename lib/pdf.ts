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
 * Build HTML for letter PDF
 */
function buildLetterHtml(
  order: any,
  assets: any,
  template: any
): string {
  const letterParagraphs = order.generatedLetter
    .split('\n\n')
    .map((p: string) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

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
          margin: 0;
        }

        body {
          font-family: '${template.fontFamily}', serif;
          color: ${template.primaryColor};
          font-size: 16pt;
          line-height: 1.6;
        }

        .page {
          width: 100%;
          min-height: 100vh;
          position: relative;
          padding: ${template.marginTop} ${template.marginRight} ${template.marginBottom} ${template.marginLeft};
          page-break-after: always;
        }

        .page-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: -1;
          ${assets.backgroundDataUri ? `
            background-image: url('${assets.backgroundDataUri}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          ` : ''}
        }

        .header {
          text-align: center;
          margin-bottom: 2em;
        }

        .header img {
          max-width: 80%;
          max-height: 150px;
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
        }

        .signature-block {
          margin-top: 2em;
          text-align: right;
          position: relative;
          z-index: 1;
        }

        .signature-block img {
          max-height: 100px;
          width: auto;
        }

        .wax-seal {
          position: fixed;
          bottom: ${template.marginBottom};
          right: ${template.marginRight};
          z-index: 2;
        }

        .wax-seal img {
          width: 80px;
          height: 80px;
        }
      </style>
    </head>
    <body>
      ${assets.backgroundDataUri ? '<div class="page-background"></div>' : ''}

      <div class="page">
        ${assets.headerDataUri ? `
          <div class="header">
            <img src="${assets.headerDataUri}" alt="">
          </div>
        ` : ''}

        <div class="letter-body">
          ${letterParagraphs}
        </div>

        <div class="signature-block">
          ${assets.signatureDataUri ? `
            <img src="${assets.signatureDataUri}" alt="${template.character}">
          ` : `
            <p>${template.character}</p>
          `}
        </div>

        ${assets.waxSealDataUri ? `
          <div class="wax-seal">
            <img src="${assets.waxSealDataUri}" alt="">
          </div>
        ` : ''}
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
  const storyParagraphs = order.generatedStory
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
          margin: 0;
        }

        body {
          font-family: '${template.fontFamily}', serif;
          color: ${template.primaryColor};
          font-size: 14pt;
          line-height: 1.8;
        }

        .page {
          width: 100%;
          min-height: 100vh;
          position: relative;
          padding: ${template.marginTop} ${template.marginRight} ${template.marginBottom} ${template.marginLeft};
        }

        .page-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          z-index: -1;
          ${assets.backgroundDataUri ? `
            background-image: url('${assets.backgroundDataUri}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.3;
          ` : ''}
        }

        h1 {
          text-align: center;
          color: ${template.accentColor};
          margin-bottom: 1.5em;
          font-size: 24pt;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .story-body {
          position: relative;
          z-index: 1;
        }

        .story-body p {
          margin-bottom: 1em;
          text-align: justify;
          text-indent: 2em;
        }

        .story-body p:first-of-type {
          text-indent: 0;
        }

        .story-body p:first-of-type::first-letter {
          font-size: 3em;
          line-height: 0.8;
          float: left;
          margin-right: 0.05em;
          color: ${template.accentColor};
          font-weight: bold;
        }

        .character-image {
          text-align: center;
          margin: 2em 0;
        }

        .character-image img {
          max-width: 200px;
          max-height: 200px;
          opacity: 0.8;
        }

        .the-end {
          text-align: center;
          margin-top: 3em;
          font-size: 18pt;
          color: ${template.accentColor};
          font-style: italic;
        }
      </style>
    </head>
    <body>
      ${assets.backgroundDataUri ? '<div class="page-background"></div>' : ''}

      <div class="page">
        <h1>${storyTitle}</h1>

        <div class="story-body">
          ${storyParagraphs}
        </div>

        ${assets.characterDataUri ? `
          <div class="character-image">
            <img src="${assets.characterDataUri}" alt="${template.character}">
          </div>
        ` : ''}

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
          background: linear-gradient(135deg, #f5f5dc 0%, #faf6f0 100%);
          border: 3px solid ${template.accentColor};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .recipient {
          text-align: center;
          font-size: 24pt;
          z-index: 1;
        }

        .from {
          position: absolute;
          top: 0.5in;
          left: 0.5in;
          font-size: 12pt;
          color: ${template.accentColor};
        }

        .stamp {
          position: absolute;
          top: 0.3in;
          right: 0.3in;
        }

        .stamp img {
          width: 60px;
          height: 60px;
        }

        .postmark {
          position: absolute;
          top: 0.5in;
          right: 1.5in;
          transform: rotate(-5deg);
          font-size: 10pt;
          color: ${template.accentColor};
          border: 2px solid ${template.accentColor};
          padding: 5px 10px;
          border-radius: 50%;
          opacity: 0.7;
        }

        .decorative-border {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          height: 20px;
          background: repeating-linear-gradient(
            45deg,
            ${template.accentColor},
            ${template.accentColor} 10px,
            white 10px,
            white 20px
          );
          opacity: 0.3;
        }
      </style>
    </head>
    <body>
      <div class="envelope">
        <div class="from">
          From: ${template.character}<br>
          North Pole
        </div>

        <div class="recipient">
          <strong>${order.recipientName}</strong>
        </div>

        ${assets.waxSealDataUri ? `
          <div class="stamp">
            <img src="${assets.waxSealDataUri}" alt="">
          </div>
        ` : ''}

        <div class="postmark">
          SPECIAL<br>
          DELIVERY
        </div>

        <div class="decorative-border"></div>
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