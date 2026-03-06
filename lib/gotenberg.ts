/**
 * Gotenberg PDF generation service
 * Connects to the Gotenberg Docker service running on Railway
 */

interface GotenbergOptions {
  paperWidth?: number;
  paperHeight?: number;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  printBackground?: boolean;
  preferCssPageSize?: boolean;
  landscape?: boolean;
}

/**
 * Render HTML to PDF using Gotenberg service
 * @param html - The HTML content to render
 * @param options - Gotenberg rendering options
 * @returns Buffer containing the PDF data
 */
export async function renderWithGotenberg(
  html: string,
  options: GotenbergOptions = {}
): Promise<Buffer> {
  const gotenbergUrl = process.env.GOTENBERG_URL || 'http://localhost:3000';

  // Default options for letter-sized paper with reasonable margins
  const defaultOptions: GotenbergOptions = {
    paperWidth: 8.5,
    paperHeight: 11,
    marginTop: '1in',
    marginBottom: '1in',
    marginLeft: '0.75in',
    marginRight: '0.75in',
    printBackground: true,
    preferCssPageSize: false,
    landscape: false,
  };

  const finalOptions = { ...defaultOptions, ...options };

  // Create form data with HTML file
  const formData = new FormData();
  const blob = new Blob([html], { type: 'text/html' });
  formData.append('files', blob, 'index.html');

  // Add rendering options to form data
  if (finalOptions.paperWidth) {
    formData.append('paperWidth', finalOptions.paperWidth.toString());
  }
  if (finalOptions.paperHeight) {
    formData.append('paperHeight', finalOptions.paperHeight.toString());
  }
  if (finalOptions.marginTop) {
    formData.append('marginTop', finalOptions.marginTop);
  }
  if (finalOptions.marginBottom) {
    formData.append('marginBottom', finalOptions.marginBottom);
  }
  if (finalOptions.marginLeft) {
    formData.append('marginLeft', finalOptions.marginLeft);
  }
  if (finalOptions.marginRight) {
    formData.append('marginRight', finalOptions.marginRight);
  }
  if (finalOptions.printBackground !== undefined) {
    formData.append('printBackground', finalOptions.printBackground.toString());
  }
  if (finalOptions.preferCssPageSize !== undefined) {
    formData.append('preferCssPageSize', finalOptions.preferCssPageSize.toString());
  }
  if (finalOptions.landscape !== undefined) {
    formData.append('landscape', finalOptions.landscape.toString());
  }

  try {
    const response = await fetch(
      `${gotenbergUrl}/forms/chromium/convert/html`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gotenberg error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Gotenberg PDF generation failed:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test Gotenberg connection with a simple HTML document
 */
export async function testGotenbergConnection(): Promise<Buffer> {
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Gotenberg Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 2rem;
        }
        h1 {
          color: #2c1810;
          border-bottom: 2px solid #8b0000;
          padding-bottom: 0.5rem;
        }
        .info {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .timestamp {
          color: #666;
          font-size: 0.9em;
        }
      </style>
    </head>
    <body>
      <h1>🎄 North Star Postal - Gotenberg Test</h1>
      <div class="info">
        <h2>PDF Generation Test Successful!</h2>
        <p>This PDF was generated using the Gotenberg service.</p>
        <p>If you can see this, the Gotenberg connection is working correctly.</p>
        <p class="timestamp">Generated at: ${new Date().toISOString()}</p>
      </div>
      <div class="info">
        <h3>System Information</h3>
        <ul>
          <li>Gotenberg URL: ${process.env.GOTENBERG_URL || 'Not configured'}</li>
          <li>Environment: ${process.env.RAILWAY_ENVIRONMENT || 'development'}</li>
        </ul>
      </div>
    </body>
    </html>
  `;

  return renderWithGotenberg(testHtml, {
    marginTop: '1in',
    marginBottom: '1in',
    marginLeft: '1in',
    marginRight: '1in',
  });
}