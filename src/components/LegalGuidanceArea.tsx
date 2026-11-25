import React, { useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Search, Send, Trash2 } from 'lucide-react';
import { LEGAL_GUIDES } from '../data/legalContent';
import type { LegalAreaCategory, LegalGuidanceAnswer } from '../types/legal';

const AREAS: LegalAreaCategory[] = [
  'Todas',
  'Consumidor',
  'Trabalhista',
  'Inquilinato',
  'Juizados e Prazos',
  'Família',
];

export const LegalGuidanceArea: React.FC = () => {
  const [selectedArea, setSelectedArea] = useState<LegalAreaCategory>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuideId, setActiveGuideId] = useState<string>(LEGAL_GUIDES[0].id);

  const [askArea, setAskArea] = useState<Exclude<LegalAreaCategory, 'Todas'>>('Consumidor');
  const [question, setQuestion] = useState('');
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [guidanceAnswer, setGuidanceAnswer] = useState<LegalGuidanceAnswer | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEGAL_GUIDES.filter((g) => {
      const matchesArea = selectedArea === 'Todas' || g.area === selectedArea;
      const matchesQuery =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.area.toLowerCase().includes(q);
      return matchesArea && matchesQuery;
    });
  }, [selectedArea, searchQuery]);

  const activeGuide =
    filteredGuides.find((g) => g.id === activeGuideId) ?? filteredGuides[0] ?? null;

  const handleAskGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoadingGuidance) return;

    setIsLoadingGuidance(true);
    setGuidanceError(null);

    try {
      const res = await fetch('/api/legal-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: askArea,
          question: trimmed,
        }),
      });
      const data = (await res.json()) as {
        guidance?: LegalGuidanceAnswer;
        error?: string;
      };
      if (!res.ok || !data.guidance) {
        throw new Error(data.error || 'Não foi possível gerar a orientação.');
      }
      setGuidanceAnswer(data.guidance);
    } catch (err) {
      setGuidanceError(
        err instanceof Error ? err.message : 'Erro ao consultar orientação jurídica.'
      );
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  const handleClearGuidance = () => {
    setGuidanceAnswer(null);
    setGuidanceError(null);
    setQuestion('');
  };

  const hasGuidanceState = Boolean(question.trim() || guidanceAnswer || guidanceError);

  return (
    <section
      id="orientacoes"
      aria-labelledby="heading-orientacoes"
      className="py-16 border-t border-slate-200"
    >
      <div className="max-w-2xl mb-8">
        <p className="text-xs font-medium text-[#1E40AF] mb-2">
          03. Área de Orientações Jurídicas
        </p>
        <h2
          id="heading-orientacoes"
          className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 [text-wrap:balance]"
        >
          Guias práticos sobre direitos, prazos e próximos passos
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600">
          Consulte orientações diretas para situações comuns do dia a dia ou envie uma dúvida específica para nossa assistência informativa.
        </p>
      </div>

      {/* Interactive Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {AREAS.map((area) => {
            const active = selectedArea === area;
            return (
              <button
                key={area}
                type="button"
                onClick={() => setSelectedArea(area)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {area}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tema ou prazo..."
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
          />
        </div>
      </div>

      {/* Guides Split View + AI Consultation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Guides Index & Detail */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredGuides.length === 0 ? (
            <div className="p-10 text-center">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm font-medium text-slate-900">
                Nenhuma orientação encontrada
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tente limpar a busca ou selecione outra área ao lado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* Topics List */}
              <div className="md:col-span-5 divide-y divide-slate-200">
                {filteredGuides.map((guide) => {
                  const isActive = activeGuide?.id === guide.id;
                  return (
                    <button
                      key={guide.id}
                      type="button"
                      onClick={() => setActiveGuideId(guide.id)}
                      className={`w-full p-4 text-left transition-colors cursor-pointer ${
                        isActive ? 'bg-slate-50' : 'bg-white hover:bg-slate-50/70'
                      }`}
                    >
                      <p className="text-xs font-medium text-[#1E40AF]">{guide.area}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
                        {guide.title}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Active Guide Reader */}
              {activeGuide && (
                <div className="md:col-span-7 p-5 sm:p-6 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                      <span className="font-medium text-[#1E40AF]">{activeGuide.area}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeGuide.typicalDeadline}</span>
                    </div>
                    <h3 className="text-lg font-display font-semibold text-slate-900">
                      {activeGuide.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600">{activeGuide.summary}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Entenda seus direitos
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-700 list-disc pl-4">
                      {activeGuide.explanation.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Como agir na prática
                    </h4>
                    <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-4">
                      {activeGuide.practicalSteps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Interactive AI Legal Guidance Assistant */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Consultar orientação jurídica por tema
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Descreva sua dúvida em linguagem comum para receber informações sobre direitos, documentos úteis e prazos.
          </p>

          <form onSubmit={handleAskGuidance} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="guidance-area-select"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Área relacionada
              </label>
              <select
                id="guidance-area-select"
                value={askArea}
                onChange={(e) =>
                  setAskArea(e.target.value as Exclude<LegalAreaCategory, 'Todas'>)
                }
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#1E40AF]"
              >
                <option value="Consumidor">Direito do Consumidor</option>
                <option value="Trabalhista">Direito Trabalhista</option>
                <option value="Inquilinato">Inquilinato e Moradia</option>
                <option value="Juizados e Prazos">Juizados e Prazos</option>
                <option value="Família">Direito de Família</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="guidance-question"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Qual é a sua dúvida?
              </label>
              <textarea
                id="guidance-question"
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ex: Comprei um celular pela internet que veio com defeito após 10 dias. Posso pedir troca ou reembolso?"
                className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!question.trim() || isLoadingGuidance}
                className="flex-1 inline-flex items-center justify-center gap-2 h-10 text-xs font-medium text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isLoadingGuidance ? 'Gerando orientação…' : 'Obter orientação'}
              </button>
              {hasGuidanceState && (
                <button
                  type="button"
                  onClick={handleClearGuidance}
                  disabled={isLoadingGuidance}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 h-10 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar
                </button>
              )}
            </div>
          </form>

          {guidanceError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{guidanceError}</span>
            </div>
          )}

          {guidanceAnswer && (
            <div className="mt-5 pt-5 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Orientação direta
                </h4>
                <button
                  type="button"
                  onClick={handleClearGuidance}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 border border-red-200 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Apagar e fazer nova pergunta
                </button>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {guidanceAnswer.directAnswer}
              </p>

              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                  Pontos importantes
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4">
                  {guidanceAnswer.keyPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-900 mb-1.5">
                  Documentos para guardar
                </h4>
                <ul className="space-y-1 text-xs text-slate-700 list-disc pl-4">
                  {guidanceAnswer.documentsToGather.map((doc, idx) => (
                    <li key={idx}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs text-slate-700">
                <p>
                  <span className="font-semibold text-slate-900">Atenção aos prazos: </span>
                  {guidanceAnswer.deadlineWarning}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Auxílio profissional: </span>
                  {guidanceAnswer.whenToSeekLawyer}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
