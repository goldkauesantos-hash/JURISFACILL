import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeLegalDocument,
  askQuestionAboutDocument,
  formatGeminiError,
  generateLegalGuidance,
} from './server/gemini.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(
    (
      err: { status?: number; type?: string; message?: string } | null,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err?.type === 'entity.too.large' || err?.status === 413) {
        res.status(413).json({
          error:
            'O arquivo PDF enviado excede o tamanho máximo suportado. Tente um arquivo menor.',
        });
        return;
      }
      if (err) {
        res.status(err.status ?? 400).json({
          error: err.message || 'Erro ao processar os dados enviados.',
        });
        return;
      }
      next();
    }
  );

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-pdf', async (req, res) => {
    try {
      const { pdfBase64, sampleText, fileName, referenceDateISO } = req.body ?? {};

      if (!pdfBase64 && !sampleText) {
        res.status(400).json({
          error: 'Envie um arquivo PDF válido ou selecione um documento de exemplo.',
        });
        return;
      }

      const safeFileName =
        typeof fileName === 'string' && fileName.trim()
          ? fileName.trim()
          : 'documento.pdf';

      const refDate =
        typeof referenceDateISO === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(referenceDateISO)
          ? referenceDateISO
          : new Date().toISOString().slice(0, 10);

      const analysis = await analyzeLegalDocument({
        pdfBase64: typeof pdfBase64 === 'string' ? pdfBase64 : undefined,
        sampleText: typeof sampleText === 'string' ? sampleText : undefined,
        fileName: safeFileName,
        referenceDateISO: refDate,
      });

      res.json({ analysis });
    } catch (err) {
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  app.post('/api/ask-document', async (req, res) => {
    try {
      const { pdfBase64, sampleText, documentTitle, plainSummary, question } =
        req.body ?? {};

      if (!question || typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: 'Digite uma pergunta sobre o documento.' });
        return;
      }

      const answer = await askQuestionAboutDocument({
        pdfBase64: typeof pdfBase64 === 'string' ? pdfBase64 : undefined,
        sampleText: typeof sampleText === 'string' ? sampleText : undefined,
        documentTitle:
          typeof documentTitle === 'string' ? documentTitle : 'Documento jurídico',
        plainSummary: typeof plainSummary === 'string' ? plainSummary : '',
        question: question.trim(),
      });

      res.json({ answer });
    } catch (err) {
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  app.post('/api/legal-guidance', async (req, res) => {
    try {
      const { area, question } = req.body ?? {};

      if (!question || typeof question !== 'string' || !question.trim()) {
        res.status(400).json({ error: 'Descreva sua dúvida jurídica.' });
        return;
      }

      const guidance = await generateLegalGuidance({
        area: typeof area === 'string' && area.trim() ? area.trim() : 'Geral',
        question: question.trim(),
      });

      res.json({ guidance });
    } catch (err) {
      res.status(500).json({ error: formatGeminiError(err) });
    }
  });

  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`JurisFácil server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
