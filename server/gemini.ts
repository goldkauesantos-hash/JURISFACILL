import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { GenerateContentParameters, GenerateContentResponse } from '@google/genai';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY não configurada. Verifique a chave em Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTransientError(err: unknown): boolean {
  const raw = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    raw.includes('503') ||
    raw.includes('unavailable') ||
    raw.includes('high demand') ||
    raw.includes('overloaded') ||
    raw.includes('timeout') ||
    raw.includes('econnreset')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetryAndFallback(
  params: Omit<GenerateContentParameters, 'model'>
): Promise<GenerateContentResponse> {
  const ai = getGeminiClient();
  const models = ['gemini-4-hydrogen', 'gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
  let lastError: unknown;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || i === models.length - 1) {
        throw err;
      }
      await sleep(700 * (i + 1));
    }
  }

  throw lastError;
}

function parseSafeJson<T>(rawText: string | undefined): T {
  const trimmed = (rawText ?? '').trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(candidate) as T;
}

export function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? 'Erro desconhecido');
  const lower = raw.toLowerCase();

  if (
    lower.includes('permission_denied') ||
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('403')
  ) {
    return 'A chave da API Gemini não pôde ser validada. Verifique ou selecione uma chave válida em Settings > Secrets.';
  }

  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand')) {
    return 'O serviço de inteligência artificial está temporariamente sobrecarregado. Tente enviar o PDF novamente em alguns segundos.';
  }

  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return 'Limite de uso atingido no momento. Tente novamente em instantes ou verifique sua cota em Settings > Secrets.';
  }

  if (lower.includes('not_found') || lower.includes('404')) {
    return 'O modelo solicitado não está disponível para esta chave de API.';
  }

  if (lower.includes('too large') || lower.includes('413') || lower.includes('request size')) {
    return 'O arquivo PDF é grande demais para envio direto. Tente um PDF menor ou com menos páginas.';
  }

  if (lower.includes('invalid argument') || lower.includes('400')) {
    return 'Não foi possível ler este PDF. Verifique se o arquivo não está corrompido ou protegido por senha.';
  }

  return raw;
}

export interface ExtractedDateItem {
  dateISO: string;
  displayDate: string;
  title: string;
  category: 'prazo' | 'audiencia' | 'vencimento' | 'assinatura' | 'outro';
  isDeadline: boolean;
  urgency: 'alta' | 'media' | 'baixa';
  actionRequired: string;
}

export interface LegalDocumentAnalysis {
  documentTitle: string;
  documentType: string;
  urgencyLevel: 'alta' | 'media' | 'baixa';
  plainSummary: string;
  detailedExplanation: string[];
  partiesInvolved: string[];
  extractedDates: ExtractedDateItem[];
  recommendedNextSteps: string[];
  importantNotice: string;
}

export async function analyzeLegalDocument(params: {
  pdfBase64?: string;
  sampleText?: string;
  fileName: string;
  referenceDateISO: string;
}): Promise<LegalDocumentAnalysis> {
  const instruction = [
    `Você é o assistente jurídico educacional do JurisFácil, especializado em traduzir documentos jurídicos brasileiros para linguagem simples e acessível a cidadãos comuns.`,
    `Data de referência atual: ${params.referenceDateISO}. Nome do arquivo: "${params.fileName}".`,
    `Analise integralmente o documento enviado e responda em português brasileiro claro, sem jargões difíceis (quando citar um termo jurídico, explique-o entre parênteses).`,
    `Identifique TODAS as datas mencionadas, vencimentos, audiências e possíveis prazos legais (inclusive prazos em dias úteis ou corridos contados a partir da intimação/notificação; quando o prazo for relativo, estime a data provável em formato YYYY-MM-DD usando a data do documento ou ${params.referenceDateISO} como base e explique na descrição).`,
    `Se não houver datas explícitas no documento, retorne uma lista vazia em extractedDates.`,
  ].join('\n');

  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (params.pdfBase64) {
    const cleanBase64 = params.pdfBase64.replace(/^data:[^;]+;base64,/, '').trim();
    if (!cleanBase64) {
      throw new Error('O arquivo PDF enviado está vazio.');
    }
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: cleanBase64,
      },
    });
  }

  if (params.sampleText) {
    parts.push({
      text: `Conteúdo do documento:\n\n${params.sampleText}`,
    });
  }

  parts.push({ text: instruction });

  const response = await generateWithRetryAndFallback({
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          documentTitle: {
            type: Type.STRING,
            description: 'Título descritivo curto para identificar o documento.',
          },
          documentType: {
            type: Type.STRING,
            description:
              'Categoria do documento (ex: Intimação Judicial, Contrato de Locação, Notificação Extrajudicial, Sentença, Acordo).',
          },
          urgencyLevel: {
            type: Type.STRING,
            description: 'Nível de urgência: "alta", "media" ou "baixa".',
          },
          plainSummary: {
            type: Type.STRING,
            description:
              'Resumo direto de 2 a 4 frases explicando o que é este documento e qual o impacto prático para a pessoa.',
          },
          detailedExplanation: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
              'Lista de 3 a 6 pontos explicando cláusulas, obrigações, valores ou decisões do documento em português simples.',
          },
          partiesInvolved: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Nomes ou papéis das partes envolvidas no documento.',
          },
          extractedDates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                dateISO: {
                  type: Type.STRING,
                  description: 'Data no formato YYYY-MM-DD.',
                },
                displayDate: {
                  type: Type.STRING,
                  description: 'Data legível em português (ex: 12/12/2026).',
                },
                title: {
                  type: Type.STRING,
                  description: 'Nome curto do marco ou prazo.',
                },
                category: {
                  type: Type.STRING,
                  description:
                    'Categoria: "prazo", "audiencia", "vencimento", "assinatura" ou "outro".',
                },
                isDeadline: {
                  type: Type.BOOLEAN,
                  description: 'True se representar um prazo que exige atenção ou ação.',
                },
                urgency: {
                  type: Type.STRING,
                  description: 'Urgência: "alta", "media" ou "baixa".',
                },
                actionRequired: {
                  type: Type.STRING,
                  description: 'O que precisa ser feito ou observado até essa data.',
                },
              },
              required: [
                'dateISO',
                'displayDate',
                'title',
                'category',
                'isDeadline',
                'urgency',
                'actionRequired',
              ],
            },
          },
          recommendedNextSteps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de 3 a 5 ações práticas recomendadas.',
          },
          importantNotice: {
            type: Type.STRING,
            description:
              'Observação de cautela lembrando sobre conferência de prazos processuais e consulta profissional.',
          },
        },
        required: [
          'documentTitle',
          'documentType',
          'urgencyLevel',
          'plainSummary',
          'detailedExplanation',
          'partiesInvolved',
          'extractedDates',
          'recommendedNextSteps',
          'importantNotice',
        ],
      },
    },
  });

  const parsed = parseSafeJson<Partial<LegalDocumentAnalysis>>(response.text);
  return {
    documentTitle: parsed.documentTitle || params.fileName,
    documentType: parsed.documentType || 'Documento jurídico',
    urgencyLevel:
      parsed.urgencyLevel === 'alta' ||
      parsed.urgencyLevel === 'baixa' ||
      parsed.urgencyLevel === 'media'
        ? parsed.urgencyLevel
        : 'media',
    plainSummary:
      parsed.plainSummary || 'Resumo não disponível para este documento.',
    detailedExplanation: Array.isArray(parsed.detailedExplanation)
      ? parsed.detailedExplanation
      : [],
    partiesInvolved: Array.isArray(parsed.partiesInvolved)
      ? parsed.partiesInvolved
      : [],
    extractedDates: Array.isArray(parsed.extractedDates)
      ? parsed.extractedDates
      : [],
    recommendedNextSteps: Array.isArray(parsed.recommendedNextSteps)
      ? parsed.recommendedNextSteps
      : [],
    importantNotice:
      parsed.importantNotice ||
      'Confira sempre os prazos diretamente no processo ou com um profissional de confiança.',
  };
}

export async function askQuestionAboutDocument(params: {
  pdfBase64?: string;
  sampleText?: string;
  documentTitle: string;
  plainSummary: string;
  question: string;
}): Promise<string> {
  const parts: Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (params.pdfBase64) {
    const cleanBase64 = params.pdfBase64.replace(/^data:[^;]+;base64,/, '').trim();
    if (cleanBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64,
        },
      });
    }
  } else if (params.sampleText) {
    parts.push({
      text: `Documento "${params.documentTitle}":\n\n${params.sampleText}`,
    });
  } else {
    parts.push({
      text: `Contexto do documento "${params.documentTitle}": ${params.plainSummary}`,
    });
  }

  parts.push({
    text: `Responda em português brasileiro claro, objetivo e acessível à seguinte dúvida do usuário sobre este documento. Caso a pergunta envolva estratégia processual específica, recomende confirmação com um advogado ou com a Defensoria Pública.\n\nPergunta: ${params.question}`,
  });

  const response = await generateWithRetryAndFallback({
    contents: { parts },
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });

  return (response.text ?? 'Não foi possível gerar uma resposta para esta dúvida.').trim();
}

export interface LegalGuidanceAnswer {
  directAnswer: string;
  keyPoints: string[];
  documentsToGather: string[];
  deadlineWarning: string;
  whenToSeekLawyer: string;
}

export async function generateLegalGuidance(params: {
  area: string;
  question: string;
}): Promise<LegalGuidanceAnswer> {
  const response = await generateWithRetryAndFallback({
    contents: [
      `Você é o módulo de orientações jurídicas informativas do JurisFácil (Brasil).`,
      `Área selecionada: ${params.area}.`,
      `Dúvida do cidadão: ${params.question}`,
      `Forneça uma orientação clara, prática, fundamentada na legislação brasileira vigente (como Código de Defesa do Consumidor, CLT, Lei do Inquilinato, CPC e Juizados Especiais), em linguagem fácil de entender. Deixe claro que esta é uma orientação informativa e não substitui consulta com advogado(a) ou Defensoria Pública.`,
    ].join('\n\n'),
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          directAnswer: {
            type: Type.STRING,
            description: 'Explicação principal clara e direta em 3 a 5 frases.',
          },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 a 5 direitos ou regras importantes aplicáveis ao caso.',
          },
          documentsToGather: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Provas ou documentos que a pessoa deve guardar ou reunir.',
          },
          deadlineWarning: {
            type: Type.STRING,
            description: 'Alerta sobre prazos legais comuns relacionados ao tema.',
          },
          whenToSeekLawyer: {
            type: Type.STRING,
            description:
              'Orientação prática sobre quando acionar Procon, Juizado Especial, Defensoria Pública ou advogado.',
          },
        },
        required: [
          'directAnswer',
          'keyPoints',
          'documentsToGather',
          'deadlineWarning',
          'whenToSeekLawyer',
        ],
      },
    },
  });

  const parsed = parseSafeJson<Partial<LegalGuidanceAnswer>>(response.text);
  return {
    directAnswer: parsed.directAnswer || 'Não foi possível gerar uma orientação.',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
    documentsToGather: Array.isArray(parsed.documentsToGather)
      ? parsed.documentsToGather
      : [],
    deadlineWarning:
      parsed.deadlineWarning ||
      'Fique atento a eventuais prazos em documentos judiciais ou contratos.',
    whenToSeekLawyer:
      parsed.whenToSeekLawyer ||
      'Em caso de processo em andamento ou dúvida específica, procure um advogado(a) ou a Defensoria Pública.',
  };
}
