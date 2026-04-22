import React, { useRef, useState, useEffect } from 'react';
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react';

type PaperFormat = 'A4' | 'A5' | 'A6' | 'Lettre';

interface PrintModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
}

const PrintModal: React.FC<PrintModalProps> = ({
  children,
  onClose,
  title = "Aperçu avant impression"
}) => {
  const [zoom, setZoom] = useState(1);
  const [format, setFormat] = useState<PaperFormat>('A4');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formats = [
    { value: 'A4', label: 'A4', dimensions: '210 x 297 mm' },
    { value: 'A5', label: 'A5', dimensions: '148 x 210 mm' },
    { value: 'A6', label: 'A6', dimensions: '105 x 148 mm' },
    { value: 'Lettre', label: 'Lettre US', dimensions: '216 x 279 mm' },
  ];

  const handlePrint = () => {
    const content = printRef.current?.cloneNode(true) as HTMLElement;
    if (!content) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: ${format}; margin: 1cm; }
            body { font-family: system-ui; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);

    win.document.close();
  };

  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, { format })
    : children;

  const containerStyle: React.CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: 'top center',
    width:
      format === 'A4'
        ? '21cm'
        : format === 'A5'
        ? '14.8cm'
        : format === 'A6'
        ? '10.5cm'
        : '21.6cm',
    minHeight: '29.7cm',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full h-full md:m-8 bg-white rounded-2xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h2 className="font-bold">{title}</h2>
          </div>

          <div className="flex items-center gap-2">

            {/* FORMAT */}
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as PaperFormat)}
              aria-label="Format du papier"
              title="Format du papier"
              className="border px-2 py-1 rounded text-sm"
            >
              {formats.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* ZOOM OUT */}
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              aria-label="Réduire le zoom"
              title="Réduire le zoom"
            >
              <ZoomOut size={18} />
            </button>

            <span className="text-xs w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>

            {/* ZOOM IN */}
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              aria-label="Augmenter le zoom"
              title="Augmenter le zoom"
            >
              <ZoomIn size={18} />
            </button>

            {/* PRINT */}
            <button
              onClick={handlePrint}
              className="bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1"
              title="Imprimer"
            >
              <Printer size={16} />
              Imprimer
            </button>

            {/* CLOSE */}
            <button
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
            >
              <X size={20} />
            </button>

          </div>
        </div>

        {/* PREVIEW */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center">
          <div
            className="bg-white shadow"
            // eslint-disable-next-line react/forbid-dom-props
            style={containerStyle}
          >
            <div ref={printRef}>
              {childrenWithProps}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-2 text-xs border-t flex justify-between">
          <span>Format : {format}</span>
          <span>Échap pour fermer</span>
        </div>

      </div>
    </div>
  );
};

export default PrintModal;