import type {
  CalendarCommitment,
  LegalGuideArticle,
  SampleLegalDoc,
} from '../types/legal';

export const SAMPLE_LEGAL_DOCS: SampleLegalDoc[] = [
  {
    id: 'intimacao-jec',
    title: 'Intimação — Juizado Especial Cível',
    type: 'Intimação Judicial',
    fileName: 'intimacao_audiencia_jec_2026.pdf',
    description:
      'Convocação para audiência de conciliação e prazo para juntada de documentos.',
    content: `PODER JUDICIÁRIO DO ESTADO DE SÃO PAULO
3º JUIZADO ESPECIAL CÍVEL DA COMARCA DA CAPITAL
Processo nº 1048291-42.2026.8.26.0100
Requerente: Marina Oliveira Santos
Requerido: Atlântica Telecomunicações S.A.

MANDADO DE INTIMAÇÃO E CITAÇÃO

Fica Vossa Senhoria INTIMADA para comparecer à AUDIÊNCIA DE CONCILIAÇÃO designada para o dia 14/12/2026, às 14h30min, a ser realizada por videoconferência (link enviado nos autos até 48 horas antes do ato).

Caso não haja acordo na audiência de conciliação, fica desde já consignado o prazo de 15 (quinze) dias úteis para apresentação de contestação e documentos comprobatórios, sob pena de revelia e confissão quanto à matéria de fato (art. 20 da Lei nº 9.099/95).

As partes deverão apresentar documento oficial com foto e comprovantes de pagamento ou protocolos de atendimento até o dia 09/12/2026 nos autos eletrônicos.

São Paulo, 25 de novembro de 2026.
Cartório do 3º Juizado Especial Cível`,
  },
  {
    id: 'contrato-locacao',
    title: 'Contrato de Locação Residencial',
    type: 'Contrato',
    fileName: 'contrato_locacao_residencial.pdf',
    description:
      'Cláusulas de aluguel, reajuste anual, multa rescisória e prazo de vistoria.',
    content: `INSTRUMENTO PARTICULAR DE LOCAÇÃO RESIDENCIAL

LOCADOR: Carlos Eduardo Mendes
LOCATÁRIA: Fernanda Almeida Rocha
IMÓVEL: Rua das Palmeiras, nº 412, apto 54, Vila Mariana, São Paulo/SP.

CLÁUSULA 1ª — DO PRAZO: A locação terá duração de 30 (trinta) meses, com início em 01/12/2026 e término previsto para 31/05/2029.
CLÁUSULA 2ª — DO ALUGUEL E VENCIMENTO: O aluguel mensal ajustado é de R$ 2.850,00, com vencimento todo dia 05 (cinco) de cada mês, sendo o primeiro pagamento devido em 05/01/2027. O atraso implicará multa moratória de 10% e juros de 1% ao mês.
CLÁUSULA 3ª — DA VISTORIA: A Locatária terá o prazo máximo de 07 (sete) dias corridos após a entrega das chaves (até 08/12/2026) para contestar por escrito eventuais divergências no Laudo de Vistoria Inicial.
CLÁUSULA 4ª — DA RESCISÃO ANTECIPADA: Caso a Locatária devolva o imóvel antes de completar 12 meses de vigência, pagará multa proporcional equivalente a 3 (três) aluguéis vigentes, reduzida proporcionalmente ao período restante do primeiro ano, além de aviso prévio de 30 (trinta) dias.`,
  },
  {
    id: 'notificacao-cobranca',
    title: 'Notificação Extrajudicial — Cobrança',
    type: 'Notificação Extrajudicial',
    fileName: 'notificacao_extrajudicial_cobranca.pdf',
    description:
      'Aviso de pendência financeira com prazo para regularização ou contestação.',
    content: `NOTIFICAÇÃO EXTRAJUDICIAL DE CONSTITUIÇÃO EM MORA

Notificante: Condomínio Residencial Jardins do Sul
Notificado: Roberto Lima Ferreira (Unidade 82)
Data de emissão: 25 de novembro de 2026

Prezado Condômino,
Servimo-nos da presente notificação para informar que constam em aberto as cotas condominiais referentes aos meses de setembro e outubro de 2026, totalizando o valor atualizado de R$ 1.640,00.

Concedemos o prazo improrrogável até 10/12/2026 para quitação integral do débito ou apresentação de comprovante de pagamento já efetuado junto à administradora.

O não atendimento até a data limite poderá ensejar o encaminhamento do débito para protesto e propositura de ação de execução judicial a partir de 18/12/2026, com acréscimo de honorários advocatícios e custas processuais.`,
  },
];

export const LEGAL_GUIDES: LegalGuideArticle[] = [
  {
    id: 'guide-intimacao',
    area: 'Juizados e Prazos',
    title: 'Recebi uma intimação ou citação judicial: o que fazer primeiro?',
    summary:
      'Entenda a diferença entre citação e intimação e como não perder o prazo de resposta ou audiência.',
    typicalDeadline: 'Prazos comuns: 5 a 15 dias úteis (conforme o ato)',
    explanation: [
      'A citação é o comunicado oficial de que existe um processo contra você; a intimação avisa sobre um ato específico, como audiência, decisão ou pedido de documento.',
      'A contagem de prazos no Processo Civil brasileiro geralmente ocorre em dias úteis, mas no Juizado Especial Criminal ou em prazos contratuais podem existir regras próprias.',
      'Nunca ignore uma carta judicial ou intimação eletrônica: a ausência injustificada em audiência pode gerar revelia (presunção de que os fatos alegados pelo outro lado são verdadeiros).',
    ],
    practicalSteps: [
      'Anote imediatamente o número do processo, a data de recebimento e a data da audiência ou prazo limite.',
      'Reúna contratos, comprovantes de pagamento, notas fiscais e conversas por escrito relacionadas ao caso.',
      'Em causas de até 20 salários mínimos no Juizado Especial Cível, é possível comparecer sem advogado na primeira instância; acima disso ou em varas comuns, procure um advogado ou a Defensoria Pública com antecedência.',
    ],
  },
  {
    id: 'guide-consumidor',
    area: 'Consumidor',
    title: 'Cobrança indevida, produto com defeito e negativação no nome',
    summary:
      'Seus direitos básicos previstos no Código de Defesa do Consumidor (CDC) e prazos para reclamação.',
    typicalDeadline: '30 dias (bens não duráveis) · 90 dias (bens duráveis)',
    explanation: [
      'Quando um produto apresenta defeito, o fornecedor tem até 30 dias para consertar. Se não resolver nesse prazo, você pode escolher entre troca por outro novo, devolução do valor pago ou abatimento no preço.',
      'Compras feitas fora da loja física (internet, telefone ou domicílio) garantem o direito de arrependimento em até 7 dias corridos a partir do recebimento, com reembolso integral.',
      'Se seu nome foi negativado por uma dívida já paga ou desconhecida, você tem direito à retirada imediata da restrição e pode pedir reparação por danos conforme o caso.',
    ],
    practicalSteps: [
      'Guarde sempre o número de protocolo de atendimento, prints da oferta, nota fiscal e boletos pagos.',
      'Registre reclamação formal no Consumidor.gov.br ou no Procon da sua cidade para criar prova documental.',
      'Antes de pagar qualquer cobrança contestada, exija o detalhamento por escrito.',
    ],
  },
  {
    id: 'guide-inquilinato',
    area: 'Inquilinato',
    title: 'Aluguel, vistoria, multa e devolução das chaves',
    summary:
      'Principais regras da Lei do Inquilinato (Lei nº 8.245/91) para evitar cobranças abusivas na entrada ou saída do imóvel.',
    typicalDeadline: '30 dias de aviso prévio na saída em prazo indeterminado',
    explanation: [
      'A multa por sair antes do término do contrato deve ser sempre proporcional ao tempo que falta cumprir, e não o valor cheio dos 3 aluguéis.',
      'Despesas extraordinárias do condomínio (como reforma de fachada, pintura externa ou fundo de reserva) pertencem ao proprietário; taxas ordinárias de manutenção do dia a dia cabem ao inquilino.',
      'O laudo de vistoria inicial é sua principal proteção para não pagar por desgastes que já existiam quando você entrou.',
    ],
    practicalSteps: [
      'Fotografe e filme cada cômodo ao receber as chaves e envie eventuais divergências por escrito dentro do prazo contratual.',
      'Ao entregar o imóvel, exija um Termo de Entrega de Chaves assinado e datado na vistoria de saída.',
      'Conserve comprovantes de quitação de água, luz, gás e condomínio até o encerramento formal do contrato.',
    ],
  },
  {
    id: 'guide-trabalhista',
    area: 'Trabalhista',
    title: 'Demissão, verbas rescisórias e prazo para ação trabalhista',
    summary:
      'O que deve ser pago após o desligamento e qual é o limite legal para cobrar direitos na Justiça do Trabalho.',
    typicalDeadline: '10 dias corridos para pagamento da rescisão · 2 anos após a saída',
    explanation: [
      'Independentemente do tipo de desligamento, o empregador tem até 10 dias corridos contados do término do contrato para pagar as verbas rescisórias e entregar os documentos de saque do FGTS e seguro-desemprego.',
      'Na demissão sem justa causa, o trabalhador tem direito a saldo de salário, férias vencidas e proporcionais (+1/3), 13º proporcional, aviso prévio e multa de 40% sobre o FGTS.',
      'O prazo para entrar com reclamação trabalhista é de até 2 anos após o fim do contrato de trabalho, podendo cobrar os últimos 5 anos trabalhados.',
    ],
    practicalSteps: [
      'Confira o Termo de Rescisão (TRCT) e o extrato analítico do FGTS antes de assinar qualquer quitação genérica.',
      'Guarde holerites, registros de ponto, crachás e mensagens de trabalho fora do horário.',
      'Caso o pagamento atrase além dos 10 dias, pode haver direito à multa prevista no art. 477 da CLT.',
    ],
  },
  {
    id: 'guide-familia',
    area: 'Família',
    title: 'Pensão alimentícia, guarda e revisão de valores',
    summary:
      'Como funciona o pedido, a atualização e a cobrança de pensão alimentícia em atraso.',
    typicalDeadline: 'Cobrança por rito de prisão abrange os últimos 3 meses vencidos',
    explanation: [
      'A pensão alimentícia é fixada considerando o binômio necessidade de quem recebe e possibilidade de quem paga, podendo ser revista judicialmente se a renda ou as despesas mudarem de forma relevante.',
      'Acordos informais feitos apenas de boca não têm força executiva imediata; homologar o acordo na Justiça ou via Defensoria protege tanto quem paga quanto quem recebe.',
      'O atraso injustificado permite execução judicial, inclusive com penhora de bens ou pedido de prisão civil para parcelas recentes.',
    ],
    practicalSteps: [
      'Guarde sempre todos os comprovantes de transferência bancária identificando que se trata de pensão.',
      'Liste mensalmente despesas fixas da criança ou adolescente (escola, saúde, alimentação) para pedidos de fixação ou revisão.',
      'Se não puder arcar com advogado particular, busque a Defensoria Pública do seu estado.',
    ],
  },
  {
    id: 'guide-juizados',
    area: 'Juizados e Prazos',
    title: 'Como funciona o Juizado Especial (Pequenas Causas) sem custos iniciais',
    summary:
      'Entenda limites de valor, gratuidade na primeira instância e quando é obrigatório ter advogado.',
    typicalDeadline: 'Recurso inominado: 10 dias úteis após a publicação da sentença',
    explanation: [
      'O Juizado Especial Cível resolve causas mais simples de até 40 salários mínimos de forma mais rápida e sem custas processuais na primeira instância.',
      'Em causas de até 20 salários mínimos, o cidadão pode dar entrada no pedido pessoalmente no setor de atermação do fórum ou via portal estadual, sem advogado.',
      'Para recorrer de uma sentença (Recurso Inominado), a presença de advogado ou Defensoria Pública passa a ser obrigatória, com prazo curto de 10 dias úteis.',
    ],
    practicalSteps: [
      'Leve RG, CPF, comprovante de residência e toda a documentação que comprove o valor pedido.',
      'Verifique antes se a empresa acionada possui endereço válido e CNPJ correto para evitar atrasos na citação.',
      'Acompanhe o andamento semanalmente pelo site do Tribunal de Justiça do seu estado.',
    ],
  },
];

export const INITIAL_CALENDAR_EVENTS: CalendarCommitment[] = [
  {
    id: 'init-1',
    dateISO: '2026-12-03',
    time: '10:00',
    title: 'Conferir documentos para audiência de conciliação',
    category: 'compromisso',
    notes: 'Separar RG, comprovantes de pagamento e protocolos de atendimento.',
    completed: false,
  },
  {
    id: 'init-2',
    dateISO: '2026-12-10',
    time: '18:00',
    title: 'Prazo limite — resposta à notificação extrajudicial',
    category: 'prazo',
    notes: 'Verificar quitação ou enviar comprovante à administradora.',
    completed: false,
  },
];
