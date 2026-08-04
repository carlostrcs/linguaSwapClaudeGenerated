#!/usr/bin/env python3
"""Write translated header maps (nameI18n / descriptionI18n) into each curated deck file.

These are what the app resolves so a featured library's TITLE and DESCRIPTION show in the
user's UI language instead of English (backend: Library.NameI18nJson / DescriptionI18nJson,
populated by DbSeeder from these header maps, resolved per request via Localized).

No API calls — a deck's name/description are short marketing strings, not graded content, so
they are maintained here by hand rather than through the model pipeline. Re-runnable and
idempotent; `emit.write_deck` preserves these maps through later gen.py / add_language.py runs.

    python set_headers.py                 # every deck
    python set_headers.py --deck food     # one deck

The frontend snapshot ignores header i18n (scripts/lib/decks.mjs reads only name/description/
entries), so `content:sync` is not required after this — but `content:check` should still pass.
"""
from __future__ import annotations

import argparse
import sys

import emit
from config import DEFAULT_LIBRARIES_DIR

# slug -> {"name": {lang: translation}, "desc": {lang: translation}} for es/fr/de/it/pt/pl.
# English stays the canonical value in the file's `name`/`description`. Descriptions drop the
# "(English, Spanish, …)" parenthetical the English copy carries — it is marketing metadata, not
# useful in an in-app library description.
HEADERS: dict[str, dict[str, dict[str, str]]] = {
    "adjectives": {
        "name": {"es": "Adjetivos esenciales", "fr": "Adjectifs essentiels", "de": "Wichtige Adjektive",
                 "it": "Aggettivi essenziali", "pt": "Adjetivos essenciais", "pl": "Podstawowe przymiotniki"},
        "desc": {"es": "Describe cualquier cosa: los adjetivos que usas cada día.",
                 "fr": "Décrivez tout : les adjectifs que vous utilisez chaque jour.",
                 "de": "Beschreibe alles — die Adjektive, die du jeden Tag brauchst.",
                 "it": "Descrivi qualsiasi cosa: gli aggettivi che usi ogni giorno.",
                 "pt": "Descreve qualquer coisa — os adjetivos que usas todos os dias.",
                 "pl": "Opisz wszystko — przymiotniki, po które sięgasz każdego dnia."},
    },
    "common-1000": {
        "name": {"es": "1000 palabras más comunes", "fr": "1000 mots les plus courants",
                 "de": "1000 häufigste Wörter", "it": "1000 parole più comuni",
                 "pt": "1000 palavras mais comuns", "pl": "1000 najczęstszych słów"},
        "desc": {"es": "Las 1000 palabras más comunes del día a día, ordenadas por uso real: vocabulario esencial para conversaciones reales.",
                 "fr": "Les 1000 mots les plus courants du quotidien, classés par usage réel : le vocabulaire de base pour de vraies conversations.",
                 "de": "Die 1000 häufigsten Alltagswörter, nach realem Gebrauch geordnet — Kernwortschatz für echte Gespräche.",
                 "it": "Le 1000 parole di uso quotidiano più comuni, ordinate per uso reale: il vocabolario di base per conversazioni vere.",
                 "pt": "As 1000 palavras do dia a dia mais comuns, ordenadas pelo uso real — vocabulário essencial para conversas reais.",
                 "pl": "1000 najczęstszych słów codziennego użytku, uszeregowanych według rzeczywistego użycia — podstawowe słownictwo do prawdziwych rozmów."},
    },
    "common-300": {
        "name": {"es": "300 palabras más comunes", "fr": "300 mots les plus courants",
                 "de": "300 häufigste Wörter", "it": "300 parole più comuni",
                 "pt": "300 palavras mais comuns", "pl": "300 najczęstszych słów"},
        "desc": {"es": "Las 300 palabras más comunes del día a día, ordenadas por uso real: la vía más rápida para entender casi todo lo que oyes.",
                 "fr": "Les 300 mots les plus courants du quotidien, classés par usage réel : le chemin le plus rapide pour comprendre presque tout ce que vous entendez.",
                 "de": "Die 300 häufigsten Alltagswörter, nach realem Gebrauch geordnet — der schnellste Weg, das meiste zu verstehen, was du hörst.",
                 "it": "Le 300 parole di uso quotidiano più comuni, ordinate per uso reale: la via più rapida per capire quasi tutto ciò che senti.",
                 "pt": "As 300 palavras do dia a dia mais comuns, ordenadas pelo uso real — o caminho mais rápido para entender quase tudo o que ouves.",
                 "pl": "300 najczęstszych słów codziennego użytku, uszeregowanych według rzeczywistego użycia — najszybsza droga do zrozumienia większości tego, co słyszysz."},
    },
    "dating": {
        "name": {"es": "Citas y ligar", "fr": "Rencontres et séduction", "de": "Daten & Flirten",
                 "it": "Appuntamenti e flirt", "pt": "Encontros e paquera", "pl": "Randki i flirt"},
        "desc": {"es": "Cumplidos, romance y salidas: palabras y frases para tener citas.",
                 "fr": "Compliments, romance et sorties : mots et expressions pour les rencontres.",
                 "de": "Komplimente, Romantik und Ausgehen — Wörter und Sätze fürs Dating.",
                 "it": "Complimenti, romanticismo e uscite: parole e frasi per gli appuntamenti.",
                 "pt": "Elogios, romance e sair à noite — palavras e frases para encontros.",
                 "pl": "Komplementy, romantyzm i wyjścia — słowa i zwroty na randki."},
    },
    "food": {
        "name": {"es": "Restaurante y comida", "fr": "Restaurant et cuisine", "de": "Restaurant & Essen",
                 "it": "Ristorante e cibo", "pt": "Restaurante e comida", "pl": "Restauracja i jedzenie"},
        "desc": {"es": "Pide con confianza: palabras de restaurante, bebidas y comida.",
                 "fr": "Commandez en toute confiance : le vocabulaire du restaurant, des boissons et de la nourriture.",
                 "de": "Bestelle mit Sicherheit — Wörter für Restaurant, Getränke und Essen.",
                 "it": "Ordina con sicurezza: parole di ristorante, bevande e cibo.",
                 "pt": "Pede com confiança — palavras de restaurante, bebidas e comida.",
                 "pl": "Zamawiaj pewnie — słowa dotyczące restauracji, napojów i jedzenia."},
    },
    "health": {
        "name": {"es": "Salud y emergencias", "fr": "Santé et urgences", "de": "Gesundheit & Notfälle",
                 "it": "Salute ed emergenze", "pt": "Saúde e emergências", "pl": "Zdrowie i nagłe wypadki"},
        "desc": {"es": "Médico, farmacia, el cuerpo y frases de emergencia para cuando importa.",
                 "fr": "Médecin, pharmacie, le corps et des phrases d'urgence pour les moments qui comptent.",
                 "de": "Arzt, Apotheke, der Körper und Notfallsätze für den Ernstfall.",
                 "it": "Medico, farmacia, il corpo e frasi di emergenza per quando conta.",
                 "pt": "Médico, farmácia, o corpo e frases de emergência para quando é importante.",
                 "pl": "Lekarz, apteka, ciało i zwroty na nagłe wypadki na trudne chwile."},
    },
    "home": {
        "name": {"es": "Hogar y objetos cotidianos", "fr": "Maison et objets du quotidien",
                 "de": "Zuhause & Alltagsgegenstände", "it": "Casa e oggetti quotidiani",
                 "pt": "Casa e objetos do dia a dia", "pl": "Dom i przedmioty codzienne"},
        "desc": {"es": "Habitaciones, muebles y los objetos que te rodean en casa.",
                 "fr": "Les pièces, les meubles et les objets qui vous entourent à la maison.",
                 "de": "Räume, Möbel und die Gegenstände um dich herum zu Hause.",
                 "it": "Stanze, mobili e gli oggetti che ti circondano in casa.",
                 "pt": "Divisões, móveis e os objetos à tua volta em casa.",
                 "pl": "Pomieszczenia, meble i przedmioty, które otaczają Cię w domu."},
    },
    "nature": {
        "name": {"es": "Naturaleza y animales", "fr": "Nature et animaux", "de": "Natur & Tiere",
                 "it": "Natura e animali", "pt": "Natureza e animais", "pl": "Przyroda i zwierzęta"},
        "desc": {"es": "Animales, clima, plantas y el mundo natural.",
                 "fr": "Les animaux, la météo, les plantes et le monde naturel.",
                 "de": "Tiere, Wetter, Pflanzen und die Natur.",
                 "it": "Animali, tempo, piante e il mondo naturale.",
                 "pt": "Animais, clima, plantas e o mundo natural.",
                 "pl": "Zwierzęta, pogoda, rośliny i świat przyrody."},
    },
    "shopping": {
        "name": {"es": "Compras", "fr": "Achats", "de": "Einkaufen",
                 "it": "Shopping", "pt": "Compras", "pl": "Zakupy"},
        "desc": {"es": "Precios, tallas, ropa y pagar: vocabulario para ir de compras.",
                 "fr": "Prix, tailles, vêtements et paiement : le vocabulaire des achats.",
                 "de": "Preise, Größen, Kleidung und Bezahlen — Wortschatz fürs Einkaufen.",
                 "it": "Prezzi, taglie, abbigliamento e pagamento: vocabolario per fare shopping.",
                 "pt": "Preços, tamanhos, roupa e pagamento — vocabulário para fazer compras.",
                 "pl": "Ceny, rozmiary, ubrania i płacenie — słownictwo na zakupy."},
    },
    "slang": {
        "name": {"es": "Jerga y modismos", "fr": "Argot et expressions", "de": "Slang & Redewendungen",
                 "it": "Slang e modi di dire", "pt": "Gíria e expressões", "pl": "Slang i idiomy"},
        "desc": {"es": "Habla como un local: palabras coloquiales y modismos comunes con su equivalente natural en cada idioma.",
                 "fr": "Parlez comme un local : mots familiers et expressions courantes avec leur équivalent naturel dans chaque langue.",
                 "de": "Klinge wie ein Einheimischer — gängige umgangssprachliche Wörter und Redewendungen mit ihrer natürlichen Entsprechung in jeder Sprache.",
                 "it": "Parla come un madrelingua: parole colloquiali e modi di dire comuni con il loro equivalente naturale in ogni lingua.",
                 "pt": "Fala como um local — palavras coloquiais e expressões comuns com o seu equivalente natural em cada língua.",
                 "pl": "Mów jak miejscowy — potoczne słowa i idiomy wraz z ich naturalnymi odpowiednikami w każdym języku."},
    },
    "smalltalk": {
        "name": {"es": "Charla y saludos", "fr": "Conversation et salutations", "de": "Small Talk & Begrüßungen",
                 "it": "Convenevoli e saluti", "pt": "Conversa e saudações", "pl": "Rozmowy towarzyskie i powitania"},
        "desc": {"es": "Saludos cotidianos, frases de cortesía y charla para sonar natural rápido.",
                 "fr": "Salutations du quotidien, formules de politesse et bavardage pour paraître naturel rapidement.",
                 "de": "Alltägliche Begrüßungen, höfliche Floskeln und Small Talk, um schnell natürlich zu klingen.",
                 "it": "Saluti di tutti i giorni, frasi di cortesia e chiacchiere per sembrare naturale in fretta.",
                 "pt": "Saudações do dia a dia, frases de cortesia e conversa fiada para soar natural depressa.",
                 "pl": "Codzienne powitania, uprzejme zwroty i luźne rozmowy, by szybko brzmieć naturalnie."},
    },
    "travel": {
        "name": {"es": "Lo esencial para viajar", "fr": "L'essentiel du voyage", "de": "Reise-Grundwortschatz",
                 "it": "L'essenziale per viaggiare", "pt": "Essenciais de viagem", "pl": "Podstawy podróży"},
        "desc": {"es": "Palabras para moverte cuando viajas: aeropuerto, transporte, hotel y direcciones.",
                 "fr": "Des mots pour se déplacer en voyage : aéroport, transports, hôtel et directions.",
                 "de": "Wörter, um dich auf Reisen zurechtzufinden — Flughafen, Verkehr, Hotel und Wegbeschreibungen.",
                 "it": "Parole per muoverti quando viaggi: aeroporto, trasporti, hotel e indicazioni.",
                 "pt": "Palavras para te orientares quando viajas — aeroporto, transportes, hotel e direções.",
                 "pl": "Słowa, które pomogą Ci się poruszać w podróży — lotnisko, transport, hotel i wskazówki dojazdu."},
    },
    "verbs": {
        "name": {"es": "Verbos esenciales", "fr": "Verbes essentiels", "de": "Wichtige Verben",
                 "it": "Verbi essenziali", "pt": "Verbos essenciais", "pl": "Podstawowe czasowniki"},
        "desc": {"es": "Los verbos del día a día que sostienen la mayoría de las conversaciones.",
                 "fr": "Les verbes du quotidien qui portent la plupart des conversations.",
                 "de": "Die alltäglichen Verben, die die meisten Gespräche tragen.",
                 "it": "I verbi di tutti i giorni che reggono la maggior parte delle conversazioni.",
                 "pt": "Os verbos do dia a dia que sustentam a maioria das conversas.",
                 "pl": "Codzienne czasowniki, na których opiera się większość rozmów."},
    },
    "work": {
        "name": {"es": "Trabajo y negocios", "fr": "Travail et affaires", "de": "Arbeit & Beruf",
                 "it": "Lavoro e affari", "pt": "Trabalho e negócios", "pl": "Praca i biznes"},
        "desc": {"es": "Oficina, reuniones y vocabulario de negocios para el trabajo.",
                 "fr": "Bureau, réunions et vocabulaire professionnel pour le travail.",
                 "de": "Büro, Meetings und Business-Wortschatz für den Arbeitsplatz.",
                 "it": "Ufficio, riunioni e vocabolario aziendale per il lavoro.",
                 "pt": "Escritório, reuniões e vocabulário de negócios para o trabalho.",
                 "pl": "Biuro, spotkania i słownictwo biznesowe do pracy."},
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--deck", help="slug of a single deck (default: every deck with a mapping)")
    args = parser.parse_args()

    slugs = [args.deck] if args.deck else list(HEADERS)
    written = 0
    for slug in slugs:
        header = HEADERS.get(slug)
        if header is None:
            print(f"  no header mapping for {slug!r} — skipping")
            continue
        path = DEFAULT_LIBRARIES_DIR / f"{slug}.json"
        name, description, rows = emit.read_existing(path)
        if not rows:
            print(f"  {slug}: no deck file / no rows — skipping")
            continue
        if emit.write_deck(path, name, description, rows, expect_rows=len(rows),
                           name_i18n=header["name"], description_i18n=header["desc"]):
            written += 1
            print(f"  {slug}: wrote nameI18n + descriptionI18n ({len(rows)} rows untouched)")
        else:
            print(f"  !! {slug}: refused (row count changed under us?)")

    print(f"\nDone: {written} deck header(s) updated.")
    if written:
        print("These are additive header fields; the frontend snapshot ignores them, so content:check "
              "still passes. The masters pick them up on the next backend startup (DbSeeder reconcile).")


if __name__ == "__main__":
    main()
