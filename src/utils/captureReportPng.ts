/**
 * Lazy-loaded rasterization for PDF export.
 * html2canvas and html-to-image are loaded ONLY when export is triggered.
 */

function decodePngDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

async function isUsableRaster(dataUrl: string): Promise<boolean> {
  if (
    typeof dataUrl !== 'string' ||
    !dataUrl.startsWith('data:image/png') ||
    dataUrl.length < 3000
  ) {
    return false;
  }
  const { width, height } = await decodePngDimensions(dataUrl);
  return width >= 120 && height >= 120;
}

/**
 * Растеризує вузол звіту для jsPDF. Бібліотеки завантажуються лише при виклику (lazy).
 */
export async function captureReportElementToPngDataUrl(element: HTMLElement): Promise<string> {
  const prev = {
    maxHeight: element.style.maxHeight,
    maxWidth: element.style.maxWidth,
    overflow: element.style.overflow,
  };

  Object.assign(element.style, {
    maxHeight: 'none',
    maxWidth: 'none',
    overflow: 'visible',
  });

  await new Promise((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 50))),
  );

  try {
    // Lazy-load html2canvas
    const attemptHtml2Canvas = async () => {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });
      return canvas.toDataURL('image/png');
    };

    // Lazy-load html-to-image
    const attemptToPng = async () => {
      const { toPng } = await import('html-to-image');
      return toPng(element, {
        backgroundColor: '#ffffff',
        cacheBust: true,
        pixelRatio: 2,
      });
    };

    let dataUrl = '';
    try {
      dataUrl = await attemptHtml2Canvas();
    } catch (err) {
      console.warn('[PDF] html2canvas:', err);
    }

    if (!(await isUsableRaster(dataUrl))) {
      try {
        dataUrl = await attemptToPng();
      } catch (err) {
        console.warn('[PDF] html-to-image:', err);
      }
    }

    if (!(await isUsableRaster(dataUrl))) {
      throw new Error(
        'Не вдалося зняти зображення звіту (інший браузер, вимкніть блокувальники реклами або розширення «privacy»).',
      );
    }

    return dataUrl;
  } finally {
    element.style.maxHeight = prev.maxHeight;
    element.style.maxWidth = prev.maxWidth;
    element.style.overflow = prev.overflow;
  }
}
