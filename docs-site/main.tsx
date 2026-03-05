import { createRoot } from 'react-dom/client';
import { App } from './App';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import './styles.css';
import '../src/styles.css';

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

createRoot(document.getElementById('root')!).render(<App />);
