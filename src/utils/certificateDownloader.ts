import html2canvas from 'html2canvas';

/**
 * Direct Download of the Certificate as a high-resolution PNG image.
 * Downloads directly to user's computer without opening the full window print dialog.
 */
export async function downloadCertificateAsImage(
  element: HTMLElement | null,
  filename: string = 'Adoption-Certificate'
): Promise<boolean> {
  if (!element) {
    console.error('[certificateDownloader] Target element not found');
    return false;
  }

  try {
    // Render the certificate element to high-DPI canvas
    const canvas = await html2canvas(element, {
      scale: 2.5, // Crisp high-res render for printing and saving
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FAF9F6',
      logging: false,
      windowWidth: 1024,
      onclone: (clonedDoc) => {
        // Ensure no shadow or unwanted scrollbars in cloned capture
        const clonedEl = clonedDoc.getElementById(element.id);
        if (clonedEl) {
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.margin = '0';
        }
      },
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('[certificateDownloader] Failed to export certificate image:', err);
    return false;
  }
}

/**
 * Isolated Print Dialog that prints ONLY the Certificate.
 * Bypasses all admin navigation, drawers, headers, tabs, and buttons completely
 * by printing within an isolated, headless container.
 */
export function printCertificateIsolated(
  element: HTMLElement | null,
  title: string = 'Certificate of Adoption'
): boolean {
  if (!element) {
    window.print();
    return false;
  }

  try {
    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      window.print();
      return false;
    }

    // Collect all stylesheets from main document
    const styleNodes = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
    const stylesHtml = styleNodes.map((s) => s.outerHTML).join('\n');

    // Clone the certificate content
    const certHtml = element.outerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          ${stylesHtml}
          <style>
            @page {
              size: letter portrait;
              margin: 10mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #FAF9F6 !important;
              color: #1D1B19 !important;
              font-family: 'DM Sans', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }
            body {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              min-height: 100vh !important;
              padding: 16px !important;
            }
            .print-wrapper {
              width: 100% !important;
              max-width: 780px !important;
              margin: 0 auto !important;
            }
            /* Clean up any UI elements that shouldn't appear on paper */
            .print\\:hidden, button, a[href^="http"]:after {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${certHtml}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Give browser time to parse CSS and fonts before triggering print
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Remove temporary iframe after print dialog is closed
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {
          // Ignore if already removed
        }
      }, 3000);
    }, 450);

    return true;
  } catch (err) {
    console.error('[certificateDownloader] Isolated print error:', err);
    window.print();
    return false;
  }
}
