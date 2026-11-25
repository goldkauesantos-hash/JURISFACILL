import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarPlus,
  Check,
  FileText,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { SAMPLE_LEGAL_DOCS } from '../data/legalContent';
import type {
  DocumentQAEntry,
  ExtractedDateItem,
  LegalDocumentAnalysis,
  SampleLegalDoc,
} from '../types/legal';

interface DocumentAnalyzerProps {
  onAddDateToCalendar: (item: ExtractedDateItem, sourceDocument: string) => void;
  onAddAllDatesToCalendar: (items: ExtractedDateItem[], sourceDocument: string) => void;
  addedKeys: Set<string>;
  externalFileTriggerRef: React.MutableRefObject<(() => void) | null>;
}

const URGENCY_LABELS: Record<string, { label: string; colorClass: string }> = {
  alta: { label: 'Urgência alta', colorClass: 'text-[#B91C1C]' },
  media: { label: 'Urgência média', colorClass: 'text-[#B45309]' },
  baixa: { label: 'Urgência baixa', colorClass: 'text-[#15803D]' },
};

const CATEGORY_LABELS: Record<string, string> = {
  prazo: 'Possível prazo',
  audiencia: 'Audiência',
  vencimento: 'Vencimento',
  assinatura: 'Assinatura',
  outro: 'Data citada',
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

async function readFileAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('O arquivo PDF selecionado está vazio.');
  }
  return arrayBufferToBase64(buffer);
}

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    if (res.status === 413) {
      throw new Error('O arquivo PDF é grande demais para envio. Tente um arquivo menor.');
    }
    throw new Error(`Resposta vazia do servidor (status ${res.status}).`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 413) {
      throw new Error('O arquivo PDF é grande demais para envio. Tente um arquivo menor.');
    }
    throw new Error(`Erro de comunicação com o servidor (status ${res.status}).`);
  }
}

export const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({
  onAddDateToCalendar,
  onAddAllDatesToCalendar,
  addedKeys,
  externalFileTriggerRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  externalFileTriggerRef.current = () => fileInputRef.current?.click();

  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [activePdfBase64, setActivePdfBase64] = useState<string | undefined>(undefined);
  const [activeSampleText, setActiveSampleText] = useState<string | undefined>(undefined);
  const [analysis, setAnalysis] = useState<LegalDocumentAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [qaInput, setQaInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaEntries, setQaEntries] = useState<DocumentQAEntry[]>([]);

  const runAnalysis = async (payload: {
    pdfBase64?: string;
    sampleText?: string;
    fileName: string;
  }) => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    setActiveFileName(payload.fileName);
    setActivePdfBase64(payload.pdfBase64);
    setActiveSampleText(payload.sampleText);
    setQaEntries([]);

    try {
      const referenceDateISO = new Date().toISOString().slice(0, 10);
      const res = await fetch('/api/analyze-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: payload.pdfBase64,
          sampleText: payload.sampleText,
          fileName: payload.fileName,
          referenceDateISO,
        }),
      });

      const data = await parseApiResponse<{
        analysis?: LegalDocumentAnalysis;
        error?: string;
      }>(res);

      if (!res.ok || !data.analysis) {
        throw new Error(data.error || 'Não foi possível analisar o documento.');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Falha ao analisar o documento.'
      );
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePdfFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Por favor, selecione um arquivo no formato PDF (.pdf).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('O arquivo PDF excede o limite de 15 MB.');
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      await runAnalysis({ pdfBase64: base64, fileName: file.name });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao carregar o PDF.');
    }
  };

  const handleLoadSample = (sample: SampleLegalDoc) => {
    void runAnalysis({
      sampleText: sample.content,
      fileName: sample.fileName,
    });
  };

  const handleAskDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = qaInput.trim();
    if (!question || !analysis || isAsking) return;

    setIsAsking(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ask-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: activePdfBase64,
          sampleText: activeSampleText,
          documentTitle: analysis.documentTitle,
          plainSummary: analysis.plainSummary,
          question,
        }),
      });
      const data = await parseApiResponse<{ answer?: string; error?: string }>(res);
      if (!res.ok || !data.answer) {
        throw new Error(data.error || 'Não foi possível responder à pergunta.');
      }

      setQaEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          question,
          answer: data.answer!,
          timestamp: Date.now(),
        },
      ]);
      setQaInput('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao consultar o documento.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleClearDocument = () => {
    setAnalysis(null);
    setActiveFileName(null);
    setActivePdfBase64(undefined);
    setActiveSampleText(undefined);
    setQaEntries([]);
    setQaInput('');
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasLoadedDocument = Boolean(analysis || activeFileName || errorMsg);

  const urgencyMeta =
    URGENCY_LABELS[analysis?.urgencyLevel ?? 'media'] ?? URGENCY_LABELS.media;

  return (
    <section
      id="analisar-pdf"
      aria-labelledby="heading-analisar-pdf"
      className="py-16 border-t border-slate-200"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handlePdfFile(file);
          e.target.value = '';
        }}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#1E40AF] mb-2">
            01. Leitura Inteligente de PDFs
          </p>
          <h2
            id="heading-analisar-pdf"
            className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 [text-wrap:balance]"
          >
            Envie seu documento em PDF e entenda cada cláusula e prazo
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Nossa inteligência artificial traduz termos jurídicos para português claro e destaca datas importantes para você organizar na agenda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {hasLoadedDocument && (
            <button
              type="button"
              onClick={handleClearDocument}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Apagar PDF
            </button>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Enviar documento em PDF
          </button>
        </div>
      </div>

      {/* Upload Dropzone + Quick Sample Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handlePdfFile(file);
            }}
            className={`border border-dashed rounded-xl p-6 text-center transition-colors bg-white ${
              isDragging
                ? 'border-[#1E40AF] bg-blue-50/40'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <div className="mx-auto w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-[#1E40AF] mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Arraste um arquivo PDF aqui
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Contratos, intimações, notificações, decisões ou acordos · Máx. 15 MB
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Selecionar arquivo PDF
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Ou teste agora com um documento modelo
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Veja na prática como a IA explica o texto e identifica os prazos.
            </p>
            <div className="mt-4 divide-y divide-slate-200">
              {SAMPLE_LEGAL_DOCS.map((sample) => (
                <div
                  key={sample.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {sample.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                      {sample.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => handleLoadSample(sample)}
                    className="px-3 py-1.5 text-xs font-medium text-[#1E40AF] border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    Analisar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Output Workspace */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 min-h-[420px]">
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isAnalyzing ? (
            <div className="space-y-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 w-2/3 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
                <div className="h-4 w-4/6 bg-slate-100 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="h-5 w-48 bg-slate-200 rounded" />
                <div className="h-16 w-full bg-slate-100 rounded" />
                <div className="h-16 w-full bg-slate-100 rounded" />
              </div>
            </div>
          ) : !analysis ? (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-4 py-10">
              <FileText className="w-9 h-9 text-slate-300 mb-3" strokeWidth={1.5} />
              <h3 className="text-base font-semibold text-slate-900">
                Nenhum documento analisado ainda
              </h3>
              <p className="mt-1.5 text-sm text-slate-500 max-w-md">
                Envie um PDF ao lado ou escolha um dos documentos modelo para receber o resumo em linguagem simples e o levantamento automático de datas e prazos.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Header & Unboxed Metadata */}
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-medium text-slate-700">{analysis.documentType}</span>
                    <span aria-hidden="true">·</span>
                    <span className={`font-semibold ${urgencyMeta.colorClass}`}>
                      {urgencyMeta.label}
                    </span>
                    {activeFileName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono truncate max-w-[240px]">{activeFileName}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-display font-semibold text-slate-900">
                    {analysis.documentTitle}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleClearDocument}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar PDF e usar outro
                </button>
              </div>

              {/* Plain Language Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  O que este documento significa
                </h4>
                <p className="text-sm sm:text-base leading-relaxed text-slate-800">
                  {analysis.plainSummary}
                </p>
              </div>

              {/* Extracted Dates & Potential Deadlines */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Datas e possíveis prazos identificados ({analysis.extractedDates.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Envie qualquer prazo diretamente para o seu calendário abaixo.
                    </p>
                  </div>
                  {analysis.extractedDates.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onAddAllDatesToCalendar(
                          analysis.extractedDates,
                          analysis.documentTitle
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1E40AF] border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Adicionar todos os prazos
                    </button>
                  )}
                </div>

                {analysis.extractedDates.length === 0 ? (
                  <p className="text-sm text-slate-500 py-2">
                    Nenhuma data ou prazo específico foi encontrado neste documento.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    {analysis.extractedDates.map((item, idx) => {
                      const key = `${item.dateISO}::${item.title}`;
                      const isAdded = addedKeys.has(key);
                      const catLabel = CATEGORY_LABELS[item.category] ?? 'Data';
                      const urg = URGENCY_LABELS[item.urgency] ?? URGENCY_LABELS.media;

                      return (
                        <div
                          key={`${key}-${idx}`}
                          className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono tabular-nums font-semibold text-slate-900">
                                {item.displayDate}
                              </span>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="font-medium text-slate-700">{catLabel}</span>
                              {item.isDeadline && (
                                <>
                                  <span aria-hidden="true" className="text-slate-300">
                                    ·
                                  </span>
                                  <span className={`font-semibold ${urg.colorClass}`}>
                                    {urg.label}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-600">
                              {item.actionRequired}
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={isAdded}
                            onClick={() =>
                              onAddDateToCalendar(item, analysis.documentTitle)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              isAdded
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 cursor-default'
                                : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Na agenda
                              </>
                            ) : (
                              <>
                                <CalendarPlus className="w-3.5 h-3.5" />
                                Agendar
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed Breakdown & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2.5">
                    Pontos principais explicados
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-4">
                    {analysis.detailedExplanation.map((point, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-2.5">
                    Próximos passos recomendados
                  </h4>
                  <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-4">
                    {analysis.recommendedNextSteps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Parties & Legal Notice */}
              {(analysis.partiesInvolved.length > 0 || analysis.importantNotice) && (
                <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
                  {analysis.partiesInvolved.length > 0 && (
                    <p>
                      <span className="font-semibold text-slate-800">Partes citadas:</span>{' '}
                      {analysis.partiesInvolved.join(' · ')}
                    </p>
                  )}
                  <p className="text-slate-500">{analysis.importantNotice}</p>
                </div>
              )}

              {/* Follow-up Q&A on this Document */}
              <div className="pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  Tirar dúvida sobre este documento
                </h4>

                {qaEntries.length > 0 && (
                  <div className="mb-3 space-y-3 divide-y divide-slate-200 bg-slate-50 border border-slate-200 rounded-lg p-3.5">
                    {qaEntries.map((entry) => (
                      <div key={entry.id} className="pt-2.5 first:pt-0">
                        <p className="text-xs font-semibold text-slate-900">
                          Pergunta: {entry.question}
                        </p>
                        <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                          {entry.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAskDocument} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={qaInput}
                    onChange={(e) => setQaInput(e.target.value)}
                    placeholder="Ex: O que acontece se eu perder esse prazo? Preciso de advogado?"
                    disabled={isAsking}
                    className="flex-1 min-w-0 h-10 px-3.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
                  />
                  <button
                    type="submit"
                    disabled={!qaInput.trim() || isAsking}
                    className="inline-flex items-center gap-1.5 px-4 h-10 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isAsking ? 'Respondendo…' : 'Perguntar'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
