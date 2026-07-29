// Portuguese guides (European Portuguese, matching the `pt` column of the decks).
// Mirrors `en.ts` key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'Como funciona a repetição espaçada',
  'leitner-boxes': 'O sistema Leitner, explicado',
  'how-many-words': 'De quantas palavras precisa mesmo?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'Como funciona a repetição espaçada (e porque reler não funciona) | LinguaSwap',
    description:
      'A repetição espaçada agenda cada palavra para revisão mesmo antes de a esquecer. Aqui fica o mecanismo, porque reler parece produtivo mas não é, e como aplicá-lo ao vocabulário.',
    heading: 'Como funciona a repetição espaçada',
    lede:
      'A repetição espaçada consiste em rever algo em intervalos crescentes, calculados para que cada revisão chegue mesmo antes de o ter esquecido. É a mudança com maior impacto que quase toda a gente pode fazer na forma como aprende vocabulário.',
    sections: [
      {
        heading: 'O problema é a curva do esquecimento',
        paragraphs: [
          'A memória de um facto isolado degrada-se depressa e de forma previsível. Aprenda uma palavra hoje e, sem reforço, a maior parte terá desaparecido em poucos dias. Aprenda-a e reveja-a amanhã, e a queda abranda. Reveja-a outra vez uns dias depois, e abranda ainda mais. Cada evocação bem-sucedida achata a curva.',
          'A consequência prática é que o momento da revisão importa mais do que a quantidade. Vinte minutos distribuídos por cinco dias superam cem minutos de uma só vez, porque cada uma das cinco sessões apanha a memória no ponto em que recuperá-la exige esforço mas ainda é possível.',
        ],
      },
      {
        heading: 'Porque reler parece resultar',
        paragraphs: [
          'Ler uma lista de palavras vezes sem conta produz uma forte sensação de familiaridade, e a familiaridade confunde-se facilmente com conhecimento. O teste não é se reconhece a resposta quando a vê: é se consegue produzi-la quando não a tem à frente.',
          'É por isso que uma prática eficaz o obriga a escrever a resposta em vez de a revelar. O que fortalece a memória é a recuperação; o reconhecimento fortalece sobretudo a sua confiança.',
        ],
      },
      {
        heading: 'O que um agendador faz de facto',
        paragraphs: [
          'Um sistema de repetição espaçada regista, palavra a palavra, o quanto a domina e quando deve voltar a vê-la. Se acerta, o intervalo seguinte cresce. Se falha, desaba para algo curto, porque uma falha significa que a memória era mais frágil do que o calendário supunha.',
          'Ao fim de algumas semanas, a sua fila de revisão enche-se discretamente com as palavras que lhe custam, enquanto as que aprendeu mesmo passam a verificações ocasionais. Passa o tempo onde isso muda o resultado.',
          'O LinguaSwap usa um sistema Leitner: o agendador mais simples que funciona bem, cinco caixas e uma única regra de subida.',
        ],
      },
      {
        heading: 'Aplicado ao vocabulário em concreto',
        paragraphs: [
          'O vocabulário é quase o caso ideal para a repetição espaçada: muitos elementos pequenos e independentes, cada um recordado ou não. É exatamente a forma em que a técnica é mais forte.',
          'Há duas coisas que vale a pena acertar. Primeiro, pratique na direção de que precisa realmente: reconhecer uma palavra espanhola a ler é uma competência diferente de a produzir a falar, e é por isso que o LinguaSwap acompanha cada direção em separado. Segundo, sessões curtas e frequentes; o trabalho é feito pelo calendário, não pela duração.',
          'Vale também a pena juntar uma nota a qualquer palavra cuja tradução, por si só, induza em erro. Um esclarecimento como «a sensação de pertença, não o edifício» é a diferença entre memorizar uma correspondência e aprender uma palavra.',
        ],
      },
    ],
    faq: [
      {
        q: 'Quanto deve durar uma sessão de repetição espaçada?',
        a: 'Dez a quinze minutos por dia são mais eficazes do que uma hora uma vez por semana. O sistema decide que palavras estão em atraso; a sua tarefa é apenas aparecer com frequência suficiente para as despachar.',
      },
      {
        q: 'A repetição espaçada é melhor do que cartões de memória?',
        a: 'A repetição espaçada é um método de agendamento e os cartões são um formato: funcionam em conjunto. Cartões de papel revistos por ordem fixa não têm o agendamento, e é daí que vem quase todo o benefício.',
      },
      {
        q: 'O que acontece quando erro uma palavra?',
        a: 'Num sistema Leitner a palavra volta à primeira caixa e reaparece muito depressa. É intencional: uma falha prova que o intervalo se tinha tornado demasiado longo.',
      },
      {
        q: 'A repetição espaçada funciona para gramática e expressões?',
        a: 'Funciona para tudo o que se possa testar por evocação, incluindo expressões fixas e colocações. É mais fraca para competências que exigem produzir em contexto, como a conversa: complementa a prática oral, não a substitui.',
      },
    ],
    faqHeading: "Perguntas frequentes",
    moreHeading: 'Mais guias',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'O sistema Leitner explicado: cinco caixas, uma regra | LinguaSwap',
    description:
      'O sistema Leitner é o agendador de repetição espaçada mais simples que funciona. Cinco caixas, uma regra de subida e um intervalo de revisão que cresce à medida que a palavra fica fácil.',
    heading: 'O sistema Leitner, explicado',
    lede:
      'O sistema Leitner é um agendador de repetição espaçada que poderia pôr a funcionar com cinco caixas de sapatos e um maço de fichas. É suficientemente simples para caber num parágrafo e suficientemente bom para o software ainda o usar cinquenta anos depois.',
    sections: [
      {
        heading: 'A regra',
        paragraphs: [
          'Cada palavra vive numa de cinco caixas. Uma palavra nova começa na caixa 1. Se acertar, sobe uma caixa. Se falhar, volta diretamente à caixa 1, por mais alto que tivesse chegado.',
          'Cada caixa tem um intervalo de revisão mais longo do que a anterior. A caixa 1 volta quase de imediato; a caixa 5 pode não voltar durante semanas. Assim, uma palavra que acerta sempre deixa rapidamente de lhe ocupar tempo, e uma que falha continua a reaparecer até ficar.',
        ],
      },
      {
        heading: 'Porque o recomeço é tão drástico',
        paragraphs: [
          'Devolver uma palavra até à caixa 1 por um único erro parece severo, e é a parte que as pessoas mais querem suavizar. Vale a pena mantê-la.',
          'Uma palavra na caixa 4 que acabou de falhar estava, por definição, mal agendada: o sistema julgava que a sabia e não sabia. A forma mais barata de recuperar de uma estimativa errada é deitá-la fora e medir de novo. Suavizar o recomeço produz sobretudo uma fila cheia de palavras que julga saber.',
        ],
      },
      {
        heading: 'O que significa «dominada»',
        paragraphs: [
          'No LinguaSwap uma palavra que chega à caixa 5 conta como dominada, e a página de estatísticas indica quantas das suas palavras lá chegaram. A posição é mostrada numa escala do vermelho ao verde: uma biblioteca maioritariamente verde é uma que aprendeu mesmo, não apenas viu.',
          'O domínio é por direção. Uma palavra pode estar na caixa 5 de espanhol para inglês e na caixa 1 de inglês para espanhol, porque produzir é mais difícil do que reconhecer. Tratá-las como um só número seria lisonjeá-lo.',
        ],
      },
      {
        heading: 'Quando usar algo que não o calendário',
        paragraphs: [
          'O calendário otimiza a retenção a longo prazo, que é o objetivo errado na véspera de um exame. É para isso que servem os outros modos: Revisão rápida percorre toda a biblioteca ignorando o calendário e, deliberadamente, não regista mudanças de caixa, para que uma sessão de última hora não corrompa semanas de dados.',
          'Do mesmo modo, Palavras difíceis puxa primeiro as caixas mais baixas e os erros mais frequentes quando quer atacar pontos fracos, e Percurso atravessa uma biblioteca grande de ponta a ponta, desbloqueando palavras novas apenas à medida que domina o conjunto atual.',
        ],
      },
    ],
    faq: [
      {
        q: 'Quantas caixas Leitner deve haver?',
        a: 'Cinco é a escolha habitual e a do LinguaSwap. Mais caixas dão intervalos mais finos mas demoram mais a mover uma palavra; menos tornam os saltos demasiado grosseiros.',
      },
      {
        q: 'Porque é que uma resposta errada devolve a ficha à caixa 1?',
        a: 'Porque a falha prova que o intervalo atual era demasiado longo. Recomeçar é a forma mais barata de medir de novo o quanto a palavra é realmente sabida.',
      },
      {
        q: 'O sistema Leitner tolera gralhas?',
        a: 'O LinguaSwap avalia depois de remover espaços supérfluos e normalizar Unicode, e ignora maiúsculas exceto onde são gramaticais, como em alemão. Os acentos contam sempre, porque um acento faz parte da palavra.',
      },
    ],
    faqHeading: "Perguntas frequentes",
    moreHeading: 'Mais guias',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: 'Quantas palavras são precisas para falar uma língua? | LinguaSwap',
    description:
      'Cerca de 300 palavras cobrem uma fatia surpreendente da fala do dia a dia, 1000 permitem conversar e 3000 deixam-no à vontade. O que significam esses números e como escolher as palavras.',
    heading: 'De quantas palavras precisa mesmo?',
    lede:
      'A frequência das palavras é muito desigual: um número pequeno de palavras faz uma fatia enorme do trabalho na fala do dia a dia. É o dado mais útil para quem está a decidir por onde começar.',
    sections: [
      {
        heading: 'Os números aproximados',
        paragraphs: [
          'Cerca de 300 palavras bem escolhidas cobrem boa parte da conversa quotidiana: as palavras funcionais, os verbos mais comuns e o punhado de substantivos que não param de aparecer. Cerca de 1000 chegam para manter uma conversa simples e seguir o essencial da fala informal. Por volta de 3000, a maioria deixa de se sentir perdida, e a partir daí o retorno achata-se para vocabulário de áreas específicas.',
          'São aproximações e variam com a língua e com o objetivo. Mas a forma é fiável: as primeiras mil palavras compram muito mais compreensão por palavra do que as quartas mil.',
        ],
      },
      {
        heading: 'Cobertura não é fluência',
        paragraphs: [
          'Conhecer as palavras que compõem 80 % de uma conversa não significa perceber 80 % dela. Os 20 % em falta não estão distribuídos por igual: concentram-se precisamente nas palavras de conteúdo que sustentam o significado da frase.',
          'Por isso as listas de frequência são um ponto de partida e não um plano. Levam-no ao nível a partir do qual pode começar a adquirir o resto pelo contexto, que é de onde acaba por vir quase todo o crescimento real do vocabulário.',
        ],
      },
      {
        heading: 'Escolher primeiro por frequência, depois por tema',
        paragraphs: [
          'A ordem mais eficiente é: primeiro o núcleo de alta frequência, depois aquilo de que precisa em concreto. Quem vai viajar precisa de vocabulário de aeroporto e direções antes do 900.º adjetivo mais comum; quem lê notícias não precisa de nenhum dos dois.',
          'O LinguaSwap traz os dois tipos de lista. As bibliotecas das 300 e das 1000 palavras mais comuns estão ordenadas por frequência de uso real, e as bibliotecas temáticas — viagem, comida, trabalho, saúde e as restantes — cobrem as situações para as quais as pessoas realmente se preparam.',
        ],
      },
      {
        heading: 'Um ritmo realista',
        paragraphs: [
          'Dez a quinze palavras novas por dia, revistas num calendário espaçado, é um ritmo que quase toda a gente aguenta. São cerca de 1000 palavras em três meses de prática constante — que chegam para mudar o que consegue fazer com a língua.',
          'A verdadeira falha não é aprender devagar de mais, é acrescentar palavras novas mais depressa do que revê as antigas, até a fila crescer e praticar passar a ser uma obrigação. Acrescentar palavras novas só quando o conjunto atual está controlado é exatamente o que o modo Percurso impõe.',
        ],
      },
    ],
    faq: [
      {
        q: 'Quantas palavras são precisas para ter fluência?',
        a: 'Não há um limiar único, mas a maioria das estimativas coloca uma fluência quotidiana confortável entre 3000 e 5000 palavras, com as primeiras 1000 a fazer uma fatia desproporcionada do trabalho.',
      },
      {
        q: 'Quantas palavras devo aprender por dia?',
        a: 'Dez a quinze palavras novas por dia são sustentáveis para a maioria, além das revisões. O fator limitante é a capacidade de revisão, não quantas palavras novas consegue absorver de uma vez.',
      },
      {
        q: 'Devo aprender primeiro as palavras mais comuns?',
        a: 'Para a compreensão geral, sim: a ordem por frequência dá mais compreensão por palavra aprendida. Se tiver uma necessidade concreta e próxima, como uma viagem, o vocabulário temático é o melhor primeiro investimento.',
      },
    ],
    faqHeading: "Perguntas frequentes",
    moreHeading: 'Mais guias',
    linkLabels: LINKS,
  },
];

export default guides;
