import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Plus,
  Trash2,
} from 'lucide-react';
import type { CalendarCommitment, EventCategory } from '../types/legal';

interface CommitmentCalendarProps {
  events: CalendarCommitment[];
  onAddEvent: (event: Omit<CalendarCommitment, 'id' | 'completed'>) => void;
  onToggleComplete: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const CATEGORY_META: Record<
  EventCategory,
  { label: string; dotClass: string; textClass: string }
> = {
  prazo: {
    label: 'Prazo',
    dotClass: 'bg-red-600',
    textClass: 'text-red-700',
  },
  audiencia: {
    label: 'Audiência',
    dotClass: 'bg-[#1E40AF]',
    textClass: 'text-[#1E40AF]',
  },
  vencimento: {
    label: 'Vencimento',
    dotClass: 'bg-amber-600',
    textClass: 'text-amber-700',
  },
  assinatura: {
    label: 'Assinatura',
    dotClass: 'bg-emerald-600',
    textClass: 'text-emerald-700',
  },
  compromisso: {
    label: 'Compromisso',
    dotClass: 'bg-slate-600',
    textClass: 'text-slate-700',
  },
  outro: {
    label: 'Outro',
    dotClass: 'bg-slate-500',
    textClass: 'text-slate-600',
  },
};

function toISODate(year: number, monthIndex: number, day: number): string {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function formatBRDate(dateISO: string): string {
  const [y, m, d] = dateISO.split('-');
  if (!y || !m || !d) return dateISO;
  return `${d}/${m}/${y}`;
}

export const CommitmentCalendar: React.FC<CommitmentCalendarProps> = ({
  events,
  onAddEvent,
  onToggleComplete,
  onDeleteEvent,
}) => {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const initialDate = useMemo(() => new Date(), []);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newCategory, setNewCategory] = useState<EventCategory>('prazo');
  const [newNotes, setNewNotes] = useState('');

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateISO: string | null }> = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, dateISO: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ day, dateISO: toISODate(viewYear, viewMonth, day) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateISO: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarCommitment[]>();
    for (const ev of events) {
      const list = map.get(ev.dateISO) ?? [];
      list.push(ev);
      map.set(ev.dateISO, list);
    }
    return map;
  }, [events]);

  const selectedDayEvents = useMemo(() => {
    return (eventsByDate.get(selectedDateISO) ?? []).sort((a, b) =>
      (a.time ?? '').localeCompare(b.time ?? '')
    );
  }, [eventsByDate, selectedDateISO]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((e) => !e.completed && e.dateISO >= todayISO)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .slice(0, 6);
  }, [events, todayISO]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateISO(todayISO);
  };

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    onAddEvent({
      dateISO: selectedDateISO,
      time: newTime || undefined,
      title,
      category: newCategory,
      notes: newNotes.trim() || undefined,
    });

    setNewTitle('');
    setNewNotes('');
  };

  return (
    <section
      id="calendario"
      aria-labelledby="heading-calendario"
      className="py-16 border-t border-slate-200"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium text-[#1E40AF] mb-2">
            02. Agenda e Prazos Jurídicos
          </p>
          <h2
            id="heading-calendario"
            className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 [text-wrap:balance]"
          >
            Calendário para organizar compromissos e prazos
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Centralize audiências, datas extraídas dos seus PDFs, vencimentos e lembretes pessoais em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Mês anterior"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3.5 h-9 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Próximo mês"
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monthly Calendar Grid */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-slate-900">
              {MONTHS[viewMonth]} de <span className="font-mono tabular-nums">{viewYear}</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {events.filter((e) => !e.completed).length} pendentes
            </span>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-xs font-medium text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.dateISO) {
                return <div key={`empty-${idx}`} className="min-h-[82px] bg-slate-50/50" />;
              }

              const dayEvents = eventsByDate.get(cell.dateISO) ?? [];
              const isSelected = cell.dateISO === selectedDateISO;
              const isToday = cell.dateISO === todayISO;

              return (
                <button
                  key={cell.dateISO}
                  type="button"
                  onClick={() => setSelectedDateISO(cell.dateISO!)}
                  className={`min-h-[82px] p-2 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 ring-1 ring-inset ring-[#1E40AF]'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono tabular-nums font-medium ${
                        isToday
                          ? 'px-1.5 py-0.5 rounded bg-[#1E40AF] text-white'
                          : isSelected
                            ? 'text-[#1E40AF] font-semibold'
                            : 'text-slate-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[11px] font-mono tabular-nums text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 w-full">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const meta = CATEGORY_META[ev.category] ?? CATEGORY_META.outro;
                      return (
                        <div
                          key={ev.id}
                          className={`flex items-center gap-1 text-[11px] leading-tight truncate ${
                            ev.completed ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        +{dayEvents.length - 2} mais
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda + Add Commitment Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-[#1E40AF]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Compromissos em{' '}
                  <span className="font-mono tabular-nums">
                    {formatBRDate(selectedDateISO)}
                  </span>
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {selectedDayEvents.length} item(ns)
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <p className="py-6 text-sm text-slate-500 text-center">
                Nenhum compromisso agendado para esta data. Use o formulário abaixo para adicionar.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {selectedDayEvents.map((ev) => {
                  const meta = CATEGORY_META[ev.category] ?? CATEGORY_META.outro;
                  return (
                    <div key={ev.id} className="py-3 flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onToggleComplete(ev.id)}
                        aria-label={
                          ev.completed
                            ? 'Marcar como pendente'
                            : 'Marcar como concluído'
                        }
                        className="mt-0.5 text-slate-400 hover:text-[#1E40AF] shrink-0 cursor-pointer"
                      >
                        {ev.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`font-semibold ${meta.textClass}`}>
                            {meta.label}
                          </span>
                          {ev.time && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="font-mono tabular-nums text-slate-500">
                                {ev.time}
                              </span>
                            </>
                          )}
                          {ev.sourceDocument && (
                            <>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                              <span className="text-slate-500 truncate max-w-[160px]">
                                {ev.sourceDocument}
                              </span>
                            </>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-sm font-medium ${
                            ev.completed ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {ev.title}
                        </p>
                        {ev.notes && (
                          <p className="mt-0.5 text-xs text-slate-600">{ev.notes}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onDeleteEvent(ev.id)}
                        aria-label="Remover compromisso"
                        className="text-slate-400 hover:text-red-600 shrink-0 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Commitment Form */}
            <form
              onSubmit={handleSubmitNew}
              className="mt-4 pt-4 border-t border-slate-200 space-y-3"
            >
              <p className="text-xs font-semibold text-slate-800">
                Novo compromisso para{' '}
                <span className="font-mono tabular-nums">
                  {formatBRDate(selectedDateISO)}
                </span>
              </p>

              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Protocolar resposta ou ir à audiência"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                  className="h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#1E40AF]"
                >
                  <option value="prazo">Prazo</option>
                  <option value="audiencia">Audiência</option>
                  <option value="vencimento">Vencimento</option>
                  <option value="assinatura">Assinatura</option>
                  <option value="compromisso">Compromisso</option>
                </select>
              </div>

              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Observação opcional (ex: levar comprovantes)"
                className="w-full h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1E40AF]"
              />

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="w-full inline-flex items-center justify-center gap-2 h-10 text-xs font-medium text-white bg-[#1E40AF] hover:bg-[#1E3A8A] rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Salvar compromisso
              </button>
            </form>
          </div>

          {/* Upcoming Chronological Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Próximos prazos e compromissos
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-xs text-slate-500">
                Todos os compromissos futuros foram concluídos.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {upcomingEvents.map((ev) => {
                  const meta = CATEGORY_META[ev.category] ?? CATEGORY_META.outro;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        const [y, m] = ev.dateISO.split('-').map(Number);
                        if (y && m) {
                          setViewYear(y);
                          setViewMonth(m - 1);
                        }
                        setSelectedDateISO(ev.dateISO);
                      }}
                      className="w-full py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-left hover:opacity-80 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {ev.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className={meta.textClass}>{meta.label}</span>
                          {ev.time ? ` · ${ev.time}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-medium text-slate-700 shrink-0">
                        {formatBRDate(ev.dateISO)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
