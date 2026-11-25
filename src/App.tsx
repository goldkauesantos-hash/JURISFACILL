import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Scale, Upload } from 'lucide-react';
import { CommitmentCalendar } from './components/CommitmentCalendar';
import { DocumentAnalyzer } from './components/DocumentAnalyzer';
import { LegalGuidanceArea } from './components/LegalGuidanceArea';
import { INITIAL_CALENDAR_EVENTS } from './data/legalContent';
import type { CalendarCommitment, ExtractedDateItem } from './types/legal';

const STORAGE_KEY = 'jurisfacil_events_v1';

function loadSavedEvents(): CalendarCommitment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CALENDAR_EVENTS;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as CalendarCommitment[];
    }
    return INITIAL_CALENDAR_EVENTS;
  } catch {
    return INITIAL_CALENDAR_EVENTS;
  }
}

export default function App() {
  const [events, setEvents] = useState<CalendarCommitment[]>(loadSavedEvents);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pdfTriggerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Ignore storage quota errors
    }
  }, [events]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const addedKeys = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      set.add(`${ev.dateISO}::${ev.title}`);
    }
    return set;
  }, [events]);

  const handleOpenPdfPicker = () => {
    const section = document.getElementById('analisar-pdf');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      pdfTriggerRef.current?.();
    }, 250);
  };

  const handleAddDateToCalendar = (
    item: ExtractedDateItem,
    sourceDocument: string
  ) => {
    const key = `${item.dateISO}::${item.title}`;
    if (addedKeys.has(key)) return;

    const newEvent: CalendarCommitment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dateISO: item.dateISO,
      time: item.category === 'audiencia' ? '14:00' : '09:00',
      title: item.title,
      category: item.category,
      notes: item.actionRequired,
      completed: false,
      sourceDocument,
    };

    setEvents((prev) => [...prev, newEvent]);
    setToastMessage(`"${item.title}" adicionado ao calendário (${item.displayDate}).`);
  };

  const handleAddAllDatesToCalendar = (
    items: ExtractedDateItem[],
    sourceDocument: string
  ) => {
    const toAdd: CalendarCommitment[] = [];
    for (const item of items) {
      const key = `${item.dateISO}::${item.title}`;
      if (!addedKeys.has(key)) {
        toAdd.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dateISO: item.dateISO,
          time: item.category === 'audiencia' ? '14:00' : '09:00',
          title: item.title,
          category: item.category,
          notes: item.actionRequired,
          completed: false,
          sourceDocument,
        });
      }
    }

    if (toAdd.length === 0) {
      setToastMessage('Todos os prazos deste documento já estão no seu calendário.');
      return;
    }

    setEvents((prev) => [...prev, ...toAdd]);
    setToastMessage(
      `${toAdd.length} ${toAdd.length === 1 ? 'prazo adicionado' : 'prazos adicionados'} ao calendário.`
    );
  };

  const handleAddManualEvent = (
    payload: Omit<CalendarCommitment, 'id' | 'completed'>
  ) => {
    const newEvent: CalendarCommitment = {
      ...payload,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      completed: false,
    };
    setEvents((prev) => [...prev, newEvent]);
    setToastMessage(`Compromisso "${payload.title}" salvo no calendário.`);
  };

  const handleToggleComplete = (id: string) => {
    setEvents((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, completed: !ev.completed } : ev))
    );
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-[#0F172A]">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#FAFBFD]/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#inicio"
            className="text-xl font-display font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            JurisFácil
          </a>

          {/* Zone 2: 4 concise single-line nav links */}
          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#inicio"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Início
            </a>
            <a
              href="#analisar-pdf"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Analisar PDF
            </a>
            <a
              href="#calendario"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Calendário
            </a>
            <a
              href="#orientacoes"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Orientações
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleOpenPdfPicker}
              className="px-4 py-2 text-xs font-medium text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Enviar PDF
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6">
        {/* Hero Split Section */}
        <section id="inicio" className="py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-semibold text-[#1E40AF] tracking-wide mb-3">
                Clareza jurídica para o dia a dia
              </p>
              <h1 className="text-[clamp(2.15rem,4vw,3.35rem)] leading-[1.12] font-display font-semibold tracking-tight text-slate-900 [text-wrap:balance]">
                Documentos jurídicos explicados em português claro
              </h1>
              <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl">
                Envie contratos, intimações ou notificações em PDF para nossa inteligência artificial traduzir cada termo técnico, identificar datas e possíveis prazos e organizar seus compromissos no calendário.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleOpenPdfPicker}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Enviar documento em PDF
                </button>
                <a
                  href="#orientacoes"
                  className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-slate-700 hover:text-[#1E40AF] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  Ver orientações jurídicas
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                {heroImgFailed ? (
                  <div className="w-full h-full min-h-[320px] flex flex-col items-center justify-center p-8 text-center bg-slate-100">
                    <Scale className="w-10 h-10 text-[#1E40AF] mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-slate-800">
                      Atendimento e organização jurídica simplificada
                    </p>
                  </div>
                ) : (
                  <img
                    src="/src/assets/images/hero_jurisfacil_office_1795611628604.jpg"
                    alt="Consultoria jurídica em mesa de escritório iluminada com documentos e notebook"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Full-width 3-Column Capability Overview below Hero Split */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                01. Explicação sem juridiquês
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Envie seu arquivo PDF e receba um resumo direto sobre o que o documento pede, quais são suas obrigações e os próximos passos.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                02. Identificação de datas e prazos
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                A leitura automática destaca audiências, vencimentos e prazos de resposta para reduzir o risco de perder uma data importante.
              </p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                03. Calendário e orientações práticas
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                Agende compromissos com um clique e consulte guias práticos sobre direitos do consumidor, trabalho, aluguel e juizados.
              </p>
            </div>
          </div>
        </section>

        {/* Section 1: PDF Upload & AI Document Explanation */}
        <DocumentAnalyzer
          onAddDateToCalendar={handleAddDateToCalendar}
          onAddAllDatesToCalendar={handleAddAllDatesToCalendar}
          addedKeys={addedKeys}
          externalFileTriggerRef={pdfTriggerRef}
        />

        {/* Section 2: Commitment Calendar */}
        <CommitmentCalendar
          events={events}
          onAddEvent={handleAddManualEvent}
          onToggleComplete={handleToggleComplete}
          onDeleteEvent={handleDeleteEvent}
        />

        {/* Section 3: Legal Guidance Area */}
        <LegalGuidanceArea />
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-base font-display font-semibold text-slate-900">
              JurisFácil
            </span>
            <p className="mt-1 text-xs text-slate-500 max-w-xl leading-relaxed">
              Plataforma informativa para leitura de documentos jurídicos, controle de prazos e educação em direitos. As análises geradas por IA não substituem consulta jurídica formal com advogado(a) inscrito(a) na OAB ou atendimento pela Defensoria Pública.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-medium text-slate-600 shrink-0">
            <a href="#inicio" className="hover:text-slate-900 whitespace-nowrap">
              Início
            </a>
            <a href="#analisar-pdf" className="hover:text-slate-900 whitespace-nowrap">
              Analisar PDF
            </a>
            <a href="#calendario" className="hover:text-slate-900 whitespace-nowrap">
              Calendário
            </a>
            <a href="#orientacoes" className="hover:text-slate-900 whitespace-nowrap">
              Orientações
            </a>
          </div>
        </div>
      </footer>

      {/* Subtle Toast Confirmation */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg"
        >
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
