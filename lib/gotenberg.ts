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
  const gotenbergUrl = process.env.GOTENBERG_URL;

  if (!gotenbergUrl) {
    throw new Error('GOTENBERG_URL environment variable is not configured. Please set up the Gotenberg service in Railway.');
  }

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

