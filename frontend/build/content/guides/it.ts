// Italian guides. Mirrors `en.ts` key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'Come funziona la ripetizione dilazionata',
  'leitner-boxes': 'Il sistema Leitner, spiegato',
  'how-many-words': 'Quante parole servono davvero?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'Come funziona la ripetizione dilazionata (e perché rileggere no) | LinguaSwap',
    description:
      'La ripetizione dilazionata programma ogni parola per il ripasso poco prima che tu la dimentichi. Ecco il meccanismo, perché rileggere sembra produttivo ma non lo è, e come usarlo per il vocabolario.',
    heading: 'Come funziona la ripetizione dilazionata',
    lede:
      'La ripetizione dilazionata consiste nel ripassare a intervalli crescenti, calcolati perché ogni ripasso arrivi poco prima che tu avessi dimenticato. È il cambiamento con più impatto che quasi chiunque possa apportare al proprio modo di imparare vocaboli.',
    sections: [
      {
        heading: "Il problema è la curva dell'oblio",
        paragraphs: [
          'La memoria di un dato isolato decade in fretta e in modo prevedibile. Impara una parola oggi e, senza rinforzo, gran parte sarà sparita in pochi giorni. Imparala e ripassala domani, e il calo rallenta. Ripassala di nuovo qualche giorno dopo, e rallenta ancora. Ogni richiamo riuscito appiattisce la curva.',
          "La conseguenza pratica è che il momento del ripasso conta più della quantità. Venti minuti distribuiti su cinque giorni battono cento minuti in un'unica seduta, perché ognuna delle cinque sessioni coglie la memoria nel punto in cui recuperarla richiede sforzo ma è ancora possibile.",
        ],
      },
      {
        heading: 'Perché rileggere sembra funzionare',
        paragraphs: [
          "Leggere una lista di parole più e più volte produce un forte senso di familiarità, e la familiarità si confonde facilmente con la conoscenza. La prova non è se riconosci la risposta quando la vedi: è se sai produrla quando non ce l'hai davanti.",
          'Per questo un buon esercizio di vocabolario ti fa scrivere la risposta invece di rivelarla. Ciò che rafforza la memoria è il recupero; il riconoscimento rafforza soprattutto la tua sicurezza.',
        ],
      },
      {
        heading: 'Cosa fa davvero un pianificatore',
        paragraphs: [
          'Un sistema di ripetizione dilazionata registra, parola per parola, quanto la padroneggi e quando dovresti rivederla. Se rispondi bene, l’intervallo successivo cresce. Se sbagli, crolla a qualcosa di breve, perché un errore significa che il ricordo era più fragile di quanto il calendario supponesse.',
          'Dopo qualche settimana la tua coda di ripasso si riempie silenziosamente delle parole che ti risultano difficili, mentre quelle davvero imparate scendono a controlli occasionali. Passi il tempo dove cambia il risultato.',
          'LinguaSwap usa un sistema Leitner: il pianificatore più semplice che funzioni bene, cinque scatole e una sola regola di promozione.',
        ],
      },
      {
        heading: 'Applicato in particolare al vocabolario',
        paragraphs: [
          "Il vocabolario è quasi il caso ideale per la ripetizione dilazionata: tanti elementi piccoli e indipendenti, ciascuno ricordato o no. È esattamente la forma su cui la tecnica è più efficace.",
          "Due cose vanno impostate bene. Primo, esercitati nella direzione che ti serve davvero: riconoscere una parola spagnola leggendo è un'abilità diversa dal produrla parlando, ed è per questo che LinguaSwap segue ogni direzione separatamente. Secondo, sessioni brevi e frequenti; il lavoro lo fa il calendario, non la durata.",
          "Vale anche la pena aggiungere una nota a ogni parola la cui traduzione, da sola, inganna. Una precisazione come «il senso di appartenenza, non l'edificio» è la differenza tra memorizzare una corrispondenza e imparare una parola.",
        ],
      },
    ],
    faq: [
      {
        q: 'Quanto dovrebbe durare una sessione di ripetizione dilazionata?',
        a: "Dieci-quindici minuti al giorno sono più efficaci di un'ora una volta alla settimana. Il sistema decide quali parole tocca ripassare; il tuo compito è solo presentarti abbastanza spesso da smaltirle.",
      },
      {
        q: 'La ripetizione dilazionata è meglio delle flashcard?',
        a: 'La ripetizione dilazionata è un metodo di programmazione e le flashcard sono un formato: funzionano insieme. Delle schede di carta ripassate in ordine fisso non hanno la programmazione, da cui però viene quasi tutto il beneficio.',
      },
      {
        q: 'Cosa succede quando sbaglio una parola?',
        a: 'In un sistema Leitner la parola torna alla prima scatola e ricompare molto presto. È voluto: un errore dimostra che l’intervallo era diventato troppo lungo.',
      },
      {
        q: 'La ripetizione dilazionata funziona per la grammatica e le espressioni?',
        a: "Funziona per tutto ciò che si può verificare col richiamo, incluse le espressioni fisse e le collocazioni. È più debole per le abilità che richiedono di produrre in contesto, come la conversazione: integra la pratica orale, non la sostituisce.",
      },
    ],
    faqHeading: "Domande frequenti",
    moreHeading: 'Altre guide',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'Il sistema Leitner spiegato: cinque scatole, una regola | LinguaSwap',
    description:
      'Il sistema Leitner è il pianificatore di ripetizione dilazionata più semplice che funzioni. Cinque scatole, una regola di promozione e un intervallo di ripasso che cresce man mano che la parola diventa facile.',
    heading: 'Il sistema Leitner, spiegato',
    lede:
      'Il sistema Leitner è un pianificatore di ripetizione dilazionata che potresti far girare con cinque scatole da scarpe e un mazzo di schede. È abbastanza semplice da spiegare in un paragrafo e abbastanza buono che il software lo usi ancora cinquant’anni dopo.',
    sections: [
      {
        heading: 'La regola',
        paragraphs: [
          'Ogni parola vive in una di cinque scatole. Una parola nuova parte dalla scatola 1. Se rispondi bene sale di una scatola. Se sbagli torna dritta alla scatola 1, per quanto in alto fosse arrivata.',
          'Ogni scatola ha un intervallo di ripasso più lungo di quella sotto. La scatola 1 ritorna quasi subito; la scatola 5 può non tornare per settimane. Così una parola che azzecchi sempre smette rapidamente di occuparti tempo, e una che sbagli continua a ripresentarsi finché non resta.',
        ],
      },
      {
        heading: 'Perché il ritorno a zero è così netto',
        paragraphs: [
          'Riportare una parola fino alla scatola 1 per un solo errore sembra severo, ed è la parte che più spesso si vorrebbe ammorbidire. Conviene tenerla.',
          'Una parola in scatola 4 che hai appena sbagliato era, per definizione, programmata male: il sistema credeva che la sapessi e non era così. Il modo più economico di rimediare a una stima sbagliata è buttarla e rimisurare. Ammorbidire il ritorno a zero produce soprattutto una coda piena di parole che credi di sapere.',
        ],
      },
      {
        heading: 'Cosa significa «padroneggiata»',
        paragraphs: [
          'In LinguaSwap una parola che raggiunge la scatola 5 conta come padroneggiata, e la pagina delle statistiche indica quante delle tue parole ci sono arrivate. La posizione è mostrata come una scala dal rosso al verde: una raccolta prevalentemente verde è una che hai davvero imparato, non solo vista.',
          'La padronanza è per direzione. Una parola può stare in scatola 5 da spagnolo a inglese e in scatola 1 da inglese a spagnolo, perché produrre è più difficile che riconoscere. Trattarle come un numero solo sarebbe lusingarti.',
        ],
      },
      {
        heading: 'Quando usare qualcosa di diverso dal calendario',
        paragraphs: [
          'Il calendario ottimizza la ritenzione a lungo termine, che è l’obiettivo sbagliato la sera prima di una verifica. A questo servono gli altri modi: Ripasso lampo percorre tutta la raccolta ignorando il calendario e, deliberatamente, non registra i cambi di scatola, così una sessione dell’ultimo minuto non corrompe settimane di dati.',
          'Allo stesso modo, Parole deboli tira fuori per prime le scatole più basse e gli errori più frequenti quando vuoi colpire i punti deboli, e Percorso attraversa una raccolta grande da cima a fondo, sbloccando parole nuove solo man mano che padroneggi il gruppo attuale.',
        ],
      },
    ],
    faq: [
      {
        q: 'Quante scatole Leitner ci vogliono?',
        a: 'Cinque è la scelta consueta ed è quella di LinguaSwap. Più scatole danno intervalli più fini ma allungano il percorso di una parola; meno rendono i salti troppo grossolani.',
      },
      {
        q: 'Perché una risposta sbagliata rimanda la scheda alla scatola 1?',
        a: 'Perché l’errore dimostra che l’intervallo attuale era troppo lungo. Azzerare è il modo più economico di rimisurare quanto la parola sia davvero saputa.',
      },
      {
        q: 'Il sistema Leitner tollera i refusi?',
        a: 'LinguaSwap valuta dopo aver eliminato gli spazi superflui e normalizzato Unicode, e ignora le maiuscole tranne dove sono grammaticali, come in tedesco. Gli accenti contano sempre, perché un accento fa parte della parola.',
      },
    ],
    faqHeading: "Domande frequenti",
    moreHeading: 'Altre guide',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: 'Quante parole servono per parlare una lingua? | LinguaSwap',
    description:
      'Circa 300 parole coprono una quota sorprendente del parlato quotidiano, 1000 ti rendono capace di conversare, 3000 ti mettono a tuo agio. Cosa significano quei numeri e come scegliere le parole.',
    heading: 'Quante parole servono davvero?',
    lede:
      'La frequenza delle parole è molto sbilanciata: un piccolo numero di parole fa una quota enorme del lavoro nel parlato quotidiano. È il dato più utile per chi sta decidendo da dove cominciare.',
    sections: [
      {
        heading: 'I numeri di massima',
        paragraphs: [
          'Circa 300 parole ben scelte coprono buona parte della conversazione quotidiana: le parole funzionali, i verbi più comuni e la manciata di sostantivi che tornano di continuo. Circa 1000 bastano a sostenere una conversazione semplice e a seguire il senso della maggior parte del parlato informale. Intorno a 3000 la maggioranza smette di sentirsi persa, e oltre i rendimenti si appiattiscono verso vocabolario di settore.',
          'Sono approssimazioni e variano secondo la lingua e secondo l’obiettivo. Ma la forma è affidabile: le prime mille parole comprano molta più comprensione per parola delle quarte mille.',
        ],
      },
      {
        heading: 'Copertura non è padronanza',
        paragraphs: [
          'Conoscere le parole che compongono l’80 % di una conversazione non significa capirne l’80 %. Il 20 % mancante non è distribuito uniformemente: si concentra proprio sulle parole di contenuto che reggono il significato della frase.',
          'Per questo le liste di frequenza sono un punto di partenza e non un piano. Ti portano al livello da cui puoi iniziare ad acquisire il resto dal contesto, che è da dove alla fine arriva quasi tutta la crescita reale del vocabolario.',
        ],
      },
      {
        heading: 'Prima per frequenza, poi per argomento',
        paragraphs: [
          'L’ordine più efficiente è: prima il nucleo ad alta frequenza, poi ciò che ti serve nello specifico. Chi sta per partire ha bisogno del vocabolario di aeroporto e indicazioni prima del 900° aggettivo più comune; chi legge notizie non ha bisogno di nessuno dei due.',
          'LinguaSwap offre entrambi i tipi di lista. Le raccolte delle 300 e delle 1000 parole più comuni sono ordinate per frequenza d’uso reale, e le raccolte tematiche — viaggi, cibo, lavoro, salute e le altre — coprono le situazioni per cui ci si prepara davvero.',
        ],
      },
      {
        heading: 'Un ritmo realistico',
        paragraphs: [
          'Dieci-quindici parole nuove al giorno, ripassate con un calendario dilazionato, è un ritmo sostenibile per quasi tutti. Fanno circa 1000 parole in tre mesi di pratica costante: abbastanza da cambiare ciò che riesci a fare con la lingua.',
          'Il vero fallimento non è imparare troppo lentamente, ma aggiungere parole nuove più in fretta di quanto ripassi le vecchie, finché la coda cresce e l’esercizio diventa un obbligo. Aggiungere parole nuove solo quando il gruppo attuale è sotto controllo è esattamente ciò che impone la modalità Percorso.',
        ],
      },
    ],
    faq: [
      {
        q: 'Quante parole servono per essere fluenti?',
        a: 'Non esiste una soglia unica, ma la maggior parte delle stime colloca una scioltezza quotidiana confortevole tra 3000 e 5000 parole, con le prime 1000 che fanno una quota sproporzionata del lavoro.',
      },
      {
        q: 'Quante parole dovrei imparare al giorno?',
        a: 'Dieci-quindici parole nuove al giorno sono sostenibili per la maggior parte, oltre ai ripassi. Il limite è la capacità di ripasso, non quante parole nuove riesci ad assorbire in una seduta.',
      },
      {
        q: 'Devo imparare prima le parole più comuni?',
        a: 'Per la comprensione generale sì: l’ordine di frequenza dà più capacità di capire per parola imparata. Se hai un’esigenza precisa e vicina, come un viaggio, il vocabolario tematico è il primo investimento migliore.',
      },
    ],
    faqHeading: "Domande frequenti",
    moreHeading: 'Altre guide',
    linkLabels: LINKS,
  },
];

export default guides;
