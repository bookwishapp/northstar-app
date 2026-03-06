import { NextRequest, NextResponse } from 'next/server';
import { testGotenbergConnection } from '@/lib/gotenberg';

/**
 * Test endpoint for Gotenberg PDF generation
 * GET /api/test/gotenberg
 *
 * Returns a test PDF if Gotenberg is working correctly
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Gotenberg connection...');
    console.log('GOTENBERG_URL:', process.env.GOTENBERG_URL || 'Not configured');

    const pdfBuffer = await testGotenbergConnection();

    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // Return the PDF with appropriate headers
    // Convert Buffer to Uint8Array for Next.js 16 compatibility
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="gotenberg-test.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Gotenberg test failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error instanceof Error ? error.message : 'Unknown error',
        gotenbergUrl: process.env.GOTENBERG_URL || 'Not configured',
      },
      { status: 500 }
    );
  }
}