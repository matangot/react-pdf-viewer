import { createRoot } from 'react-dom/client';
import { PdfViewer } from '../src';
import '../src/styles.css';
import { GlobalWorkerOptions } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function App() {
  return (
    <PdfViewer
      src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
      theme="system"
    />
  );
}

createRoot(document.getElementById('root')!).render(<App />);
