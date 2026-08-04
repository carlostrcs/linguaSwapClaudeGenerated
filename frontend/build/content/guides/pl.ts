// Polish guides. Mirrors en.ts structure key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'Jak działają powtórki rozłożone w czasie',
  'leitner-boxes': 'System Leitnera w pigułce',
  'how-many-words': 'Ile słów naprawdę potrzebujesz?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'Jak działają powtórki rozłożone w czasie — i dlaczego ponowne czytanie nie | LinguaSwap',
    description:
      'Powtórki rozłożone w czasie planują powtórkę każdego słowa tuż zanim byś je zapomniał. Oto mechanizm, dlaczego ponowne czytanie sprawia wrażenie skutecznego, choć takie nie jest, i jak wykorzystać to w nauce słówek.',
    heading: 'Jak działają powtórki rozłożone w czasie',
    lede:
      'Powtórki rozłożone w czasie to powtarzanie materiału w coraz dłuższych odstępach, zaplanowanych tak, by każda powtórka trafiała tuż zanim zdążyłbyś zapomnieć. To pojedyncza zmiana o największej dźwigni, jaką większość ludzi może wprowadzić w naukę słówek.',
    sections: [
      {
        heading: 'Problemem jest krzywa zapominania',
        paragraphs: [
          'Pamięć pojedynczego, oderwanego faktu zanika szybko i przewidywalnie. Naucz się dziś słowa, a bez wzmocnienia większość z niego zniknie w ciągu kilku dni. Naucz się go i powtórz jutro, a zanikanie zwolni. Powtórz je jeszcze raz kilka dni później, a zwolni jeszcze bardziej. Każde udane przypomnienie spłaszcza tę krzywą.',
          'Praktyczny wniosek jest taki, że moment powtórki liczy się bardziej niż jej ilość. Dwadzieścia minut rozłożonych na pięć dni bije sto minut za jednym posiedzeniem, bo każda z pięciu sesji łapie pamięć w punkcie, w którym jej przywołanie wymaga wysiłku, ale wciąż jest możliwe.',
        ],
      },
      {
        heading: 'Dlaczego ponowne czytanie sprawia wrażenie skutecznego',
        paragraphs: [
          'Czytanie listy słów w kółko daje silne poczucie znajomości, a znajomość łatwo pomylić z wiedzą. Sprawdzianem nie jest to, czy rozpoznajesz odpowiedź, gdy ją widzisz — lecz to, czy potrafisz ją wytworzyć, gdy jej nie widzisz.',
          'Dlatego skuteczne ćwiczenie słówek każe Ci wpisać odpowiedź, a nie ją odsłonić. To przywoływanie wzmacnia pamięć; rozpoznawanie wzmacnia głównie Twoją pewność siebie.',
        ],
      },
      {
        heading: 'Co właściwie robi planer powtórek',
        paragraphs: [
          'Planer powtórek rozłożonych w czasie śledzi — dla każdego słowa — jak dobrze je znasz i kiedy powinieneś zobaczyć je ponownie. Odpowiedz poprawnie, a kolejny odstęp rośnie. Odpowiedz błędnie, a kurczy się do czegoś krótkiego, bo nieudane przypomnienie oznacza, że pamięć była słabsza, niż zakładał harmonogram.',
          'Efekt po kilku tygodniach jest taki, że Twoja kolejka powtórek cicho zapełnia się słowami, które sprawiają Ci trudność, podczas gdy te naprawdę opanowane schodzą do sporadycznych kontroli. Spędzasz czas tam, gdzie zmienia to wynik.',
          'LinguaSwap korzysta z systemu Leitnera — najprostszego planera, który działa dobrze: pięć pudełek i jedna reguła awansu.',
        ],
      },
      {
        heading: 'Zastosowanie konkretnie do słówek',
        paragraphs: [
          'Słownictwo jest bliskie idealnemu przypadkowi dla powtórek rozłożonych w czasie: duża liczba małych, niezależnych elementów, z których każdy jest albo przypomniany, albo nie. To dokładnie ten kształt, na którym technika jest najsilniejsza.',
          'Dwie rzeczy warto zrobić dobrze. Po pierwsze, ćwicz w kierunku, którego naprawdę potrzebujesz — rozpoznawanie hiszpańskiego słowa podczas czytania to inna umiejętność niż wytwarzanie go podczas mówienia, i właśnie dlatego LinguaSwap śledzi każdy kierunek osobno. Po drugie, utrzymuj sesje krótkie i częste; to harmonogram wykonuje pracę, a nie długość sesji.',
          'Warto też dodać notatkę do każdego słowa, którego tłumaczenie samo w sobie wprowadza w błąd. Objaśnienie w rodzaju „poczucie przynależności, a nie budynek” to różnica między wykuciem odwzorowania a nauczeniem się słowa.',
        ],
      },
    ],
    faq: [
      {
        q: 'Jak długa powinna być sesja powtórek rozłożonych w czasie?',
        a: 'Dziesięć do piętnastu minut dziennie jest skuteczniejsze niż godzina raz w tygodniu. Planer decyduje, które słowa są do powtórki; Twoim zadaniem jest tylko pojawiać się wystarczająco często, by je czyścić.',
      },
      {
        q: 'Czy powtórki rozłożone w czasie są lepsze niż fiszki?',
        a: 'Powtórki rozłożone w czasie to metoda planowania, a fiszki to format — jedno działa z drugim. Papierowe fiszki przeglądane w stałej kolejności nie mają planowania, a to stąd bierze się większość korzyści.',
      },
      {
        q: 'Co się dzieje, gdy pomylę słowo?',
        a: 'W systemie Leitnera słowo spada z powrotem do pierwszego pudełka i wraca bardzo szybko. Tak ma być: nieudane przypomnienie to dowód, że odstęp urósł zbyt długi.',
      },
      {
        q: 'Czy powtórki rozłożone w czasie działają na gramatykę i wyrażenia?',
        a: 'Działają na wszystko, co można sprawdzić przez przypomnienie, w tym utarte zwroty i kolokacje. Są najsłabsze w umiejętnościach wymagających produkcji w kontekście, jak rozmowa — dlatego są uzupełnieniem ćwiczenia mówienia, a nie jego zamiennikiem.',
      },
    ],
    faqHeading: 'Częste pytania',
    moreHeading: 'Więcej poradników',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'System Leitnera wyjaśniony: pięć pudełek, jedna reguła | LinguaSwap',
    description:
      'System Leitnera to najprostszy działający planer powtórek rozłożonych w czasie. Pięć pudełek, jedna reguła awansu i odstęp powtórek rosnący w miarę, jak słowo staje się łatwiejsze.',
    heading: 'System Leitnera w pigułce',
    lede:
      'System Leitnera to planer powtórek rozłożonych w czasie, który mógłbyś prowadzić za pomocą pięciu pudełek po butach i stosu kartek. Jest dość prosty, by wyjaśnić go w jednym akapicie, i dość dobry, że oprogramowanie korzysta z niego pięćdziesiąt lat później.',
    sections: [
      {
        heading: 'Reguła',
        paragraphs: [
          'Każde słowo mieszka w jednym z pięciu pudełek. Nowe słowo zaczyna w pudełku 1. Odpowiedz na nie poprawnie, a przechodzi o jedno pudełko wyżej. Odpowiedz błędnie, a wraca prosto do pudełka 1, niezależnie od tego, jak wysoko się wspięło.',
          'Każde pudełko ma dłuższy odstęp powtórek niż to poniżej. Pudełko 1 wraca niemal natychmiast; pudełko 5 może nie wrócić przez tygodnie. Więc słowo, które ciągle odpowiadasz poprawnie, szybko przestaje zajmować Ci czas, a słowo, które ciągle mylisz, wraca, aż zostanie w głowie.',
        ],
      },
      {
        heading: 'Dlaczego reset jest tak bezwzględny',
        paragraphs: [
          'Zrzucenie słowa aż do pudełka 1 po jednym błędzie wygląda surowo i to właśnie ten element ludzie najczęściej chcą złagodzić. Warto go zachować.',
          'Słowo w pudełku 4, które właśnie pomyliłeś, było z definicji zaplanowane błędnie — system sądził, że je znasz, a Ty nie. Najtańszym sposobem naprawy błędnego oszacowania jest wyrzucenie go i ponowny pomiar. Łagodzenie resetu daje głównie kolejkę pełną słów, które wydaje Ci się, że znasz.',
        ],
      },
      {
        heading: 'Co znaczy „opanowane”',
        paragraphs: [
          'W LinguaSwap słowo, które dociera do pudełka 5, liczy się jako opanowane, a strona statystyk pokazuje, ile Twoich słów tam dotarło. Pozycję pudełka pokazuje rampa od czerwieni do zieleni, więc biblioteka w większości zielona to taka, której naprawdę się nauczyłeś, a nie taka, którą jedynie widziałeś.',
          'Opanowanie jest zależne od kierunku. Słowo może siedzieć w pudełku 5 dla kierunku hiszpański → angielski i w pudełku 1 dla angielski → hiszpański, bo wytworzenie słowa jest trudniejszą umiejętnością niż jego rozpoznanie. Traktowanie ich jako jednej liczby by Ci pochlebiało.',
        ],
      },
      {
        heading: 'Kiedy sięgnąć po coś innego niż harmonogram',
        paragraphs: [
          'Harmonogram optymalizuje pod długotrwałe zapamiętywanie, co jest złym celem w noc przed egzaminem. Do tego służą inne tryby ćwiczeń: Kucie przechodzi przez całą bibliotekę, ignorując harmonogram, i celowo nie zapisuje zmian pudełek, więc panika w ostatniej chwili nie psuje tygodni danych o planowaniu.',
          'Podobnie Słabe słowa wyciąga najpierw najniższe pudełka i najczęściej mylone elementy, gdy chcesz uderzyć wprost w problematyczne miejsca, a Podróż prowadzi dużą bibliotekę od początku do końca, odblokowując nowe słowa dopiero w miarę opanowywania bieżącego zestawu.',
        ],
      },
    ],
    faq: [
      {
        q: 'Ile powinno być pudełek Leitnera?',
        a: 'Pięć to typowy wybór i tyle stosuje LinguaSwap. Więcej pudełek daje drobniejsze odstępy, ale dłużej przeprowadza słowo na drugą stronę; mniej sprawia, że skoki są zbyt zgrubne.',
      },
      {
        q: 'Dlaczego błędna odpowiedź odsyła kartę do pudełka 1?',
        a: 'Bo błąd jest dowodem, że obecny odstęp był zbyt długi. Reset to najtańszy sposób, by na nowo zmierzyć, jak dobrze słowo jest faktycznie znane.',
      },
      {
        q: 'Czy system Leitnera radzi sobie z literówkami?',
        a: 'LinguaSwap ocenia odpowiedzi po przycięciu spacji i normalizacji Unicode oraz nie zważa na wielkość liter, z wyjątkiem miejsc, gdzie wielkość jest gramatyczna, jak w niemieckim. Znaki diakrytyczne zawsze mają znaczenie, bo znak diakrytyczny jest częścią słowa.',
      },
    ],
    faqHeading: 'Częste pytania',
    moreHeading: 'Więcej poradników',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: 'Ile słów trzeba, by mówić w danym języku? | LinguaSwap',
    description:
      'Około 300 słów pokrywa zaskakująco dużą część codziennej mowy, 1000 pozwala się dogadać, a 3000 daje swobodę. Co oznaczają te liczby i jak wybrać, których słów się uczyć.',
    heading: 'Ile słów naprawdę potrzebujesz?',
    lede:
      'Częstość słów jest stroma: niewielka liczba słów wykonuje bardzo dużą część pracy w codziennej mowie. To pojedynczy najbardziej przydatny fakt dla każdego, kto decyduje, czego uczyć się najpierw.',
    sections: [
      {
        heading: 'Przybliżone liczby',
        paragraphs: [
          'Około 300 dobrze dobranych słów pokrywa dużą część codziennej rozmowy — słowa funkcyjne, najczęstsze czasowniki i garść rzeczowników, które wciąż wracają. Około 1000 wystarcza, by prowadzić prostą rozmowę i chwytać sedno większości swobodnej mowy. Około 3000 to punkt, w którym większość ludzi przestaje czuć się zagubiona, a dalej zyski spłaszczają się w słownictwo do konkretnych dziedzin.',
          'To przybliżenia i różnią się w zależności od języka i tego, co chcesz robić. Ale kształt jest niezawodny: pierwszy tysiąc słów kupuje znacznie więcej rozumienia na słowo niż czwarty tysiąc.',
        ],
      },
      {
        heading: 'Pokrycie to nie to samo co płynność',
        paragraphs: [
          'Znajomość słów tworzących 80% rozmowy nie oznacza rozumienia 80% jej treści. Brakujące 20% nie jest równomiernie rozłożone — skupia się dokładnie na tych słowach treściowych, które niosą znaczenie zdania.',
          'Dlatego listy częstości są punktem wyjścia, a nie planem. Doprowadzają Cię do poziomu, na którym możesz zacząć zdobywać resztę z kontekstu, i stąd ostatecznie bierze się większość realnego wzrostu słownictwa.',
        ],
      },
      {
        heading: 'Wybieraj najpierw według częstości, potem według tematu',
        paragraphs: [
          'Najefektywniejsza kolejność to: najpierw rdzeń o wysokiej częstości, potem to, czego konkretnie potrzebujesz. Ktoś, kto właśnie wybiera się w podróż, prędzej potrzebuje słownictwa lotniskowego i o kierunkach niż 900. najczęstszego przymiotnika; ktoś, kto czyta wiadomości, nie potrzebuje żadnego z nich.',
          'LinguaSwap zawiera oba rodzaje list. Biblioteki 300 i 1000 najczęstszych słów są uszeregowane według rzeczywistej częstości użycia, a biblioteki tematyczne — podróże, jedzenie, praca, zdrowie i reszta — pokrywają sytuacje, do których ludzie faktycznie się przygotowują.',
        ],
      },
      {
        heading: 'Realistyczne tempo',
        paragraphs: [
          'Dziesięć do piętnastu nowych słów dziennie, powtarzanych według harmonogramu rozłożonego w czasie, to tempo, które większość ludzi jest w stanie utrzymać. To mniej więcej 1000 słów w trzy miesiące systematycznej praktyki — dość, by zmienić to, co potrafisz zrobić w danym języku.',
          'Pułapką nie jest zbyt wolna nauka; jest nią dodawanie nowych słów szybciej, niż powtarzasz stare, tak że kolejka powtórek rośnie, aż ćwiczenie staje się mordęgą. Dodawanie nowych słów tylko wtedy, gdy bieżący zestaw jest pod kontrolą, to dokładnie to, co wymusza tryb Podróż.',
        ],
      },
    ],
    faq: [
      {
        q: 'Ile słów trzeba, by być płynnym?',
        a: 'Nie ma jednego progu, ale większość szacunków umieszcza swobodną, codzienną płynność gdzieś między 3000 a 5000 słów, przy czym pierwszy 1000 wykonuje nieproporcjonalnie dużą część pracy.',
      },
      {
        q: 'Ile słów powinienem uczyć się dziennie?',
        a: 'Dziesięć do piętnastu nowych słów dziennie jest do utrzymania dla większości ludzi obok powtórek. Czynnikiem ograniczającym jest zdolność do powtórek, a nie to, ile nowych słów zdołasz wchłonąć za jednym posiedzeniem.',
      },
      {
        q: 'Czy powinienem uczyć się najpierw najczęstszych słów?',
        a: 'Dla ogólnego rozumienia — tak, kolejność według częstości daje najwięcej rozumienia na wyuczone słowo. Jeśli masz konkretną, bliską potrzebę, jak wyjazd, słownictwo tematyczne jest lepszą pierwszą inwestycją.',
      },
    ],
    faqHeading: 'Częste pytania',
    moreHeading: 'Więcej poradników',
    linkLabels: LINKS,
  },
];

export default guides;
