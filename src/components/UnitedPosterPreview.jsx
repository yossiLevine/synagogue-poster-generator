import { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function UnitedPosterPreview({ title, parasha, synagogues, onClose }) {
  const posterRef = useRef(null);

  const handleDownloadPDF = async () => {
    const el = posterRef.current;
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pw, ph);
    const safe = s => s.replace(/[/\\?%*:|"<>]/g, '-');
    pdf.save(`${safe(title)}${parasha ? ` - פרשת ${safe(parasha)}` : ''}.pdf`);
  };

  const handlePrint = () => window.print();

  const visibleSynagogues = synagogues.filter(s => s.name && s.prayerRows.some(r => r.label));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-bold text-lg">תצוגה מקדימה — מודעה מאוחדת</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
              <Printer className="w-3.5 h-3.5" /> הדפסה
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Poster */}
        <div className="overflow-auto flex-1 p-4">
          <div
            ref={posterRef}
            id="united-print-area"
            className="bg-white mx-auto shadow-lg"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '12mm',
              fontFamily: "'Heebo', sans-serif",
              direction: 'rtl',
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1a2e5a', paddingBottom: '8px', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1a2e5a', margin: '0 0 4px' }}>{title}</h1>
              {parasha && (
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#1a2e5a', margin: '0' }}>פרשת {parasha}</p>
              )}
            </div>

            {/* Synagogues grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: visibleSynagogues.length === 1 ? '1fr' : visibleSynagogues.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {visibleSynagogues.map((syn, idx) => (
                <div
                  key={syn.id}
                  style={{
                    border: '1.5px solid #c9b87a',
                    borderRadius: '10px',
                    padding: '12px',
                    background: idx % 2 === 0 ? '#fdfaf4' : '#f4f8fd',
                  }}
                >
                  {/* Synagogue name */}
                  <div style={{
                    textAlign: 'center',
                    background: '#1a2e5a',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    marginBottom: '10px',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}>
                    {syn.name}
                  </div>

                  {/* Prayer rows */}
                  {syn.prayerRows.filter(r => r.label).map((row, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 6px',
                        borderRadius: '4px',
                        backgroundColor: i % 2 === 0 ? 'rgba(26,46,90,0.05)' : 'transparent',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: '#1a2e5a' }}>{row.label}</span>
                      <span style={{ fontWeight: '700', color: '#1a2e5a', fontVariantNumeric: 'tabular-nums' }}>{row.time || '—'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px solid #e0d8c8', paddingTop: '8px' }}>
              <p style={{ fontSize: '9px', color: '#999', margin: '0' }}>
                הופק באמצעות המחולל מבית <strong>YL.AI</strong> · פתרונות AI לעסקים ומוסדות · 050-733-3117
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}