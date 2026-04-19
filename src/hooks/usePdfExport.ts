import { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { captureReportElementToPngDataUrl } from '../utils/captureReportPng';
import type { AppSection, VafExportData } from '../types/vaf';

interface UsePdfExportReturn {
  pdfCaptureOpen: boolean;
  pdfBusy: boolean;
  exportPDF: () => Promise<void>;
}

export function usePdfExport(
  appSection: AppSection,
  vafDataForExport: VafExportData | null,
): UsePdfExportReturn {
  const [pdfCaptureOpen, setPdfCaptureOpen] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const exportPDF: () => Promise<void> = useCallback(async () => {
    const reportId = 'pdf-report-export';
    if (!document.getElementById(reportId)) {
      alert('Не знайдено макету звіту. Спробуйте оновити сторінку.');
      return;
    }
    if (pdfBusy) return;
    setPdfBusy(true);

    flushSync(() => setPdfCaptureOpen(true));
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 450))),
    );

    const element = document.getElementById(reportId);
    if (!element) {
      alert('Макет звіту тимчасово недоступний. Спробуйте ще раз.');
      flushSync(() => setPdfCaptureOpen(false));
      setPdfBusy(false);
      return;
    }

    try {
      const dataUrl = await captureReportElementToPngDataUrl(element);
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - 2 * margin;
      const usableH = pageH - 2 * margin;

      const imgProps = pdf.getImageProperties(dataUrl);
      const iw = imgProps.width;
      const ih = imgProps.height;
      const imgScale = Math.min(usableW / iw, usableH / ih);
      const imgWmm = iw * imgScale;
      const imgHmm = ih * imgScale;
      const imgX = margin + (usableW - imgWmm) / 2;
      const imgY = margin;

      pdf.addImage(dataUrl, 'PNG', imgX, imgY, imgWmm, imgHmm);
      const filename =
        appSection === 'vaf'
          ? `VAF_Report_${vafDataForExport?.objectName || 'Export'}.pdf`
          : 'VectorAnalyzer_Report.pdf';
      pdf.save(filename);
    } catch (e) {
      console.error('PDF Export error:', e);
      alert('Не вдалося згенерувати PDF. Будь ласка, спробуйте ще раз.');
    } finally {
      flushSync(() => {
        setPdfCaptureOpen(false);
        setPdfBusy(false);
      });
    }
  }, [pdfBusy, appSection, vafDataForExport]);

  return { pdfCaptureOpen, pdfBusy, exportPDF };
}
