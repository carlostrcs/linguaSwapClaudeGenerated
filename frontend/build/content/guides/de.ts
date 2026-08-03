// German guides. Mirrors `en.ts` key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'So funktioniert verteilte Wiederholung',
  'leitner-boxes': 'Das Leitner-System, erklärt',
  'how-many-words': 'Wie viele Wörter brauchst du wirklich?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'So funktioniert verteilte Wiederholung — und warum Nochmallesen nicht | LinguaSwap',
    description:
      'Verteilte Wiederholung plant jedes Wort so ein, dass es kurz vor dem Vergessen wiederkommt. Hier ist der Mechanismus, warum Nochmallesen produktiv wirkt, es aber nicht ist, und wie du das für Vokabeln nutzt.',
    heading: 'So funktioniert verteilte Wiederholung',
    lede:
      'Verteilte Wiederholung heißt: in wachsenden Abständen wiederholen, jeweils getaktet auf den Moment kurz bevor du es vergessen hättest. Es ist die wirksamste einzelne Änderung, die die meisten Menschen an ihrem Vokabellernen vornehmen können.',
    sections: [
      {
        heading: 'Das Problem ist die Vergessenskurve',
        paragraphs: [
          'Das Gedächtnis für eine einzelne Information zerfällt schnell und vorhersagbar. Lernst du ein Wort heute und tust nichts weiter, ist das meiste davon in wenigen Tagen weg. Wiederholst du es morgen, verlangsamt sich der Zerfall. Wiederholst du es ein paar Tage später erneut, verlangsamt er sich weiter. Jeder erfolgreiche Abruf flacht die Kurve ab.',
          'Praktisch heißt das: Der Zeitpunkt der Wiederholung zählt mehr als die Menge. Zwanzig Minuten über fünf Tage verteilt schlagen hundert Minuten am Stück, weil jede der fünf Einheiten das Gedächtnis genau dort trifft, wo der Abruf anstrengend, aber noch möglich ist.',
        ],
      },
      {
        heading: 'Warum Nochmallesen sich richtig anfühlt',
        paragraphs: [
          'Eine Wortliste immer wieder zu lesen erzeugt ein starkes Gefühl von Vertrautheit — und Vertrautheit wird leicht mit Wissen verwechselt. Der Test ist nicht, ob du die Antwort erkennst, wenn du sie siehst, sondern ob du sie produzieren kannst, wenn du sie nicht siehst.',
          'Deshalb lässt gutes Vokabeltraining dich die Antwort tippen statt sie aufzudecken. Was das Gedächtnis stärkt, ist der Abruf; das Wiedererkennen stärkt vor allem dein Selbstvertrauen.',
        ],
      },
      {
        heading: 'Was ein Planer tatsächlich tut',
        paragraphs: [
          'Ein System für verteilte Wiederholung merkt sich pro Wort, wie gut du es kannst und wann du es wiedersehen solltest. Richtige Antwort: Der nächste Abstand wächst. Falsche Antwort: Er fällt auf etwas Kurzes zurück, denn ein Fehlschlag heißt, dass die Erinnerung schwächer war als angenommen.',
          'Nach ein paar Wochen füllt sich deine Warteschlange leise mit den Wörtern, die dir schwerfallen, während die wirklich gelernten auf gelegentliche Kontrollen zurückfallen. Du verbringst deine Zeit dort, wo sie das Ergebnis verändert.',
          'LinguaSwap nutzt ein Leitner-System: der einfachste Planer, der gut funktioniert — fünf Fächer und eine einzige Aufstiegsregel.',
        ],
      },
      {
        heading: 'Speziell für Vokabeln',
        paragraphs: [
          'Vokabeln sind nahezu der Idealfall für verteilte Wiederholung: viele kleine, voneinander unabhängige Einheiten, jede entweder abgerufen oder nicht. Genau da ist die Technik am stärksten.',
          'Zwei Dinge lohnen sich. Erstens: Übe in der Richtung, die du wirklich brauchst — ein spanisches Wort beim Lesen zu erkennen ist eine andere Fähigkeit, als es beim Sprechen zu produzieren, und genau deshalb erfasst LinguaSwap jede Richtung getrennt. Zweitens: kurze, häufige Einheiten; die Arbeit macht der Plan, nicht die Sitzungsdauer.',
          'Ebenfalls sinnvoll: eine Notiz bei jedem Wort, dessen Übersetzung für sich genommen in die Irre führt. Ein Hinweis wie „das Gefühl von Zugehörigkeit, nicht das Gebäude" ist der Unterschied zwischen dem Auswendiglernen einer Zuordnung und dem Lernen eines Wortes.',
        ],
      },
    ],
    faq: [
      {
        q: 'Wie lange sollte eine Einheit verteilter Wiederholung dauern?',
        a: 'Zehn bis fünfzehn Minuten täglich sind wirksamer als eine Stunde einmal pro Woche. Der Planer entscheidet, welche Wörter fällig sind; deine Aufgabe ist nur, oft genug zu erscheinen, um sie abzuarbeiten.',
      },
      {
        q: 'Ist verteilte Wiederholung besser als Karteikarten?',
        a: 'Verteilte Wiederholung ist eine Planungsmethode, Karteikarten sind ein Format — beides gehört zusammen. Papierkarten in fester Reihenfolge haben keine Planung, und genau daher kommt der größte Teil des Nutzens.',
      },
      {
        q: 'Was passiert, wenn ich ein Wort falsch habe?',
        a: 'Im Leitner-System fällt das Wort zurück in das erste Fach und kommt sehr bald wieder. Das ist Absicht: Ein Fehlschlag belegt, dass der Abstand zu lang geworden war.',
      },
      {
        q: 'Funktioniert verteilte Wiederholung auch für Grammatik und Wendungen?',
        a: 'Sie funktioniert für alles, was sich per Abruf prüfen lässt, einschließlich fester Wendungen und Kollokationen. Am schwächsten ist sie bei Fähigkeiten, die Produktion im Kontext verlangen — etwa Konversation. Sie ergänzt das Sprechen, ersetzt es nicht.',
      },
    ],
    faqHeading: "Häufige Fragen",
    moreHeading: 'Weitere Ratgeber',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'Das Leitner-System erklärt: fünf Fächer, eine Regel | LinguaSwap',
    description:
      'Das Leitner-System ist der einfachste Planer für verteilte Wiederholung, der funktioniert. Fünf Fächer, eine Aufstiegsregel und ein Wiederholungsabstand, der wächst, sobald ein Wort leichter fällt.',
    heading: 'Das Leitner-System, erklärt',
    lede:
      'Das Leitner-System ist ein Planer für verteilte Wiederholung, den du mit fünf Schuhkartons und einem Stapel Karten betreiben könntest. Einfach genug für einen Absatz Erklärung — und gut genug, dass Software es fünfzig Jahre später noch verwendet.',
    sections: [
      {
        heading: 'Die Regel',
        paragraphs: [
          'Jedes Wort liegt in einem von fünf Fächern. Ein neues Wort startet in Fach 1. Richtig beantwortet steigt es ein Fach auf. Falsch beantwortet fällt es sofort zurück in Fach 1, egal wie hoch es geklettert war.',
          'Jedes Fach hat einen längeren Wiederholungsabstand als das darunter. Fach 1 kommt fast sofort wieder; Fach 5 vielleicht wochenlang nicht. Ein Wort, das du zuverlässig kannst, kostet dich also schnell keine Zeit mehr, und ein Wort, das du immer wieder verfehlst, taucht so lange auf, bis es sitzt.',
        ],
      },
      {
        heading: 'Warum der Rücksetzer so hart ist',
        paragraphs: [
          'Ein Wort wegen eines einzigen Fehlers ganz nach Fach 1 zurückzuwerfen wirkt streng, und genau das wollen die meisten abmildern. Es lohnt sich, es zu behalten.',
          'Ein Wort in Fach 4, das du gerade verfehlt hast, war per Definition falsch eingeplant — das System glaubte, du könntest es, und du konntest es nicht. Der billigste Weg aus einer schlechten Schätzung ist, sie wegzuwerfen und neu zu messen. Ein weicherer Rücksetzer erzeugt vor allem eine Warteschlange voller Wörter, von denen du glaubst, du könntest sie.',
        ],
      },
      {
        heading: 'Was „gemeistert" bedeutet',
        paragraphs: [
          'In LinguaSwap gilt ein Wort, das Fach 5 erreicht, als gemeistert, und die Statistikseite zeigt, wie viele deiner Wörter dort angekommen sind. Die Fachposition erscheint als Farbverlauf von Rot nach Grün: Eine überwiegend grüne Bibliothek ist eine, die du wirklich gelernt und nicht bloß gesehen hast.',
          'Meisterung gilt pro Richtung. Ein Wort kann für Spanisch → Englisch in Fach 5 stehen und für Englisch → Spanisch in Fach 1, weil Produzieren schwerer ist als Erkennen. Beides zu einer Zahl zusammenzufassen wäre Selbstbetrug.',
        ],
      },
      {
        heading: 'Wann etwas anderes als der Plan sinnvoll ist',
        paragraphs: [
          'Der Plan optimiert langfristiges Behalten — das falsche Ziel am Abend vor einer Prüfung. Dafür gibt es die anderen Modi: Pauken geht die ganze Bibliothek durch und ignoriert den Plan, und es erfasst bewusst keine Fachwechsel, damit eine Panik-Session nicht wochenlange Plandaten verdirbt.',
          'Ebenso holt Schwache Wörter zuerst die niedrigsten Fächer und häufigsten Fehler nach vorn, wenn du gezielt Schwachstellen angehen willst, und Reise arbeitet eine große Bibliothek von vorn bis hinten durch und schaltet neue Wörter erst frei, wenn der aktuelle Satz sitzt.',
        ],
      },
    ],
    faq: [
      {
        q: 'Wie viele Leitner-Fächer sollten es sein?',
        a: 'Fünf ist die übliche Wahl und die von LinguaSwap. Mehr Fächer geben feinere Abstände, brauchen aber länger, um ein Wort durchzuschleusen; weniger machen die Sprünge zu grob.',
      },
      {
        q: 'Warum wirft eine falsche Antwort die Karte zurück in Fach 1?',
        a: 'Weil der Fehler belegt, dass der aktuelle Abstand zu lang war. Zurücksetzen ist der billigste Weg, neu zu messen, wie gut das Wort tatsächlich sitzt.',
      },
      {
        q: 'Verzeiht das Leitner-System Tippfehler?',
        a: 'LinguaSwap bewertet nach dem Entfernen überflüssiger Leerzeichen und einer Unicode-Normalisierung und ignoriert Groß- und Kleinschreibung — außer wo sie grammatisch ist, wie im Deutschen. Akzente zählen immer, denn ein Akzent gehört zum Wort.',
      },
    ],
    faqHeading: "Häufige Fragen",
    moreHeading: 'Weitere Ratgeber',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: 'Wie viele Wörter braucht man, um eine Sprache zu sprechen? | LinguaSwap',
    description:
      'Rund 300 Wörter decken einen erstaunlichen Teil der Alltagssprache ab, 1000 machen dich gesprächsfähig, 3000 machen dich sicher. Was diese Zahlen bedeuten und wie du auswählst.',
    heading: 'Wie viele Wörter brauchst du wirklich?',
    lede:
      'Worthäufigkeit ist extrem ungleich verteilt: Eine kleine Zahl von Wörtern erledigt einen sehr großen Teil der Alltagssprache. Das ist die nützlichste Tatsache für alle, die entscheiden, womit sie anfangen.',
    sections: [
      {
        heading: 'Die groben Zahlen',
        paragraphs: [
          'Etwa 300 gut gewählte Wörter decken einen großen Teil des Alltagsgesprächs ab: die Funktionswörter, die häufigsten Verben und die Handvoll Substantive, die immer wieder auftauchen. Rund 1000 reichen für ein einfaches Gespräch und um dem Sinn der meisten lockeren Rede zu folgen. Bei etwa 3000 hören die meisten auf, sich verloren zu fühlen; darüber flacht der Ertrag zu Fachvokabular ab.',
          'Das sind Näherungswerte und sie schwanken je nach Sprache und Ziel. Aber die Form ist verlässlich: Die ersten tausend Wörter kaufen weit mehr Verständnis pro Wort als die vierten tausend.',
        ],
      },
      {
        heading: 'Abdeckung ist nicht dasselbe wie Sprachbeherrschung',
        paragraphs: [
          'Die Wörter zu kennen, die 80 % eines Gesprächs ausmachen, heißt nicht, 80 % davon zu verstehen. Die fehlenden 20 % sind nicht gleichmäßig verteilt: Sie ballen sich genau bei den Inhaltswörtern, die die Bedeutung des Satzes tragen.',
          'Deshalb sind Häufigkeitslisten ein Anfang und kein Plan. Sie bringen dich auf das Niveau, ab dem du den Rest aus dem Kontext aufnehmen kannst — und daher stammt am Ende das meiste echte Vokabelwachstum.',
        ],
      },
      {
        heading: 'Erst nach Häufigkeit wählen, dann nach Thema',
        paragraphs: [
          'Die effizienteste Reihenfolge: zuerst der häufige Kern, dann das, was du konkret brauchst. Wer verreist, braucht Flughafen- und Wegbeschreibungsvokabular eher als das 900.-häufigste Adjektiv; wer Nachrichten liest, braucht beides nicht.',
          'LinguaSwap bringt beide Arten von Liste mit. Die Bibliotheken der 300 und 1000 häufigsten Wörter sind nach tatsächlicher Gebrauchshäufigkeit sortiert, und die Themenbibliotheken — Reise, Essen, Arbeit, Gesundheit und die übrigen — decken die Situationen ab, auf die man sich wirklich vorbereitet.',
        ],
      },
      {
        heading: 'Ein realistisches Tempo',
        paragraphs: [
          'Zehn bis fünfzehn neue Wörter am Tag, verteilt wiederholt, ist ein Tempo, das die meisten durchhalten. Das sind rund 1000 Wörter in drei Monaten stetiger Praxis — genug, um zu verändern, was du mit der Sprache anfangen kannst.',
          'Das eigentliche Scheitern ist nicht zu langsames Lernen, sondern neue Wörter schneller hinzuzufügen, als du alte wiederholst, bis die Warteschlange wächst und Üben zur Pflicht wird. Neue Wörter erst hinzuzunehmen, wenn der aktuelle Satz im Griff ist, ist genau das, was der Reise-Modus erzwingt.',
        ],
      },
    ],
    faq: [
      {
        q: 'Wie viele Wörter braucht man für fließendes Sprechen?',
        a: 'Es gibt keine feste Schwelle, aber die meisten Schätzungen sehen bequeme Alltagssicherheit zwischen 3000 und 5000 Wörtern, wobei die ersten 1000 einen überproportionalen Anteil leisten.',
      },
      {
        q: 'Wie viele Wörter sollte ich pro Tag lernen?',
        a: 'Zehn bis fünfzehn neue Wörter am Tag sind für die meisten neben den Wiederholungen tragbar. Der begrenzende Faktor ist die Wiederholungskapazität, nicht wie viele neue Wörter du auf einmal aufnehmen kannst.',
      },
      {
        q: 'Soll ich zuerst die häufigsten Wörter lernen?',
        a: 'Für allgemeines Verständnis ja — die Häufigkeitsreihenfolge liefert das meiste Verstehen pro gelerntem Wort. Bei einem konkreten, nahen Anlass wie einer Reise ist Themenvokabular die bessere erste Investition.',
      },
    ],
    faqHeading: "Häufige Fragen",
    moreHeading: 'Weitere Ratgeber',
    linkLabels: LINKS,
  },
];

export default guides;
