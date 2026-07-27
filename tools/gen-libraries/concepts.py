"""Concept sourcing — produces a ranked list of English single-word concepts.

Frequency decks pull straight from wordfreq's usage ranking, so the words are the
ones actually worth learning first. Function words are dropped: they have no clean
1:1 translation across the six languages (English 'the' is el/la/los/las, le/la/les,
der/die/das...), which would make a flashcard row wrong by construction.
"""
from __future__ import annotations

from wordfreq import top_n_list, zipf_frequency

# English function words: articles, pronouns, prepositions, conjunctions,
# auxiliaries, determiners. Dropped from frequency decks (see module docstring).
STOPWORDS: set[str] = {
    "a", "an", "the", "this", "that", "these", "those", "there", "here",
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their", "mine", "yours", "hers", "ours", "theirs",
    "myself", "yourself", "himself", "herself", "itself", "ourselves", "themselves",
    "who", "whom", "whose", "which", "what", "when", "where", "why", "how",
    "am", "is", "are", "was", "were", "be", "been", "being",
    "do", "does", "did", "done", "doing",
    "have", "has", "had", "having",
    "will", "would", "shall", "should", "can", "could", "may", "might", "must",
    "and", "or", "but", "if", "then", "else", "so", "than", "as", "because",
    "of", "to", "in", "on", "at", "by", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below",
    "from", "up", "down", "out", "off", "over", "under", "again", "further",
    "not", "no", "nor", "only", "own", "same", "too", "very", "just", "also",
    "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
    "s", "t", "don", "now", "ll", "re", "ve", "d", "m", "o", "y",
    "yes", "ok", "okay", "oh", "ah", "hey", "hi", "um", "uh", "yeah", "gonna",
    "let", "get", "got", "going", "one", "two",
    # Vague adverbs/intensifiers: no clean single-word concept to drill.
    "even", "really", "much", "back", "well", "still", "ever", "never", "always",
    "already", "yet", "maybe", "perhaps", "quite", "rather", "almost", "enough",
    "away", "around", "along", "though", "however", "actually", "anything",
    "something", "nothing", "everything", "someone", "everyone", "anyone",
    # Irregular past/participle forms — the infinitive is the teachable card.
    "said", "made", "went", "came", "took", "saw", "knew", "gave", "found",
    "told", "thought", "felt", "left", "put", "kept", "held", "brought",
    "began", "ran", "heard", "met", "paid", "sat", "stood", "lost", "won",
    "become", "became", "seen", "done", "gone", "been", "had", "were", "was",
    # Remaining function words that survive the frequency ranking.
    "while", "since", "without", "another", "every", "per", "via", "upon",
    "among", "toward", "towards", "across", "behind", "beyond", "within",
    "unless", "whether", "either", "neither", "instead", "therefore",
}


# Irregular plurals the suffix rules can't reduce.
IRREGULAR_BASE: dict[str, str] = {
    "women": "woman", "men": "man", "children": "child", "feet": "foot",
    "teeth": "tooth", "geese": "goose", "mice": "mouse", "lives": "life",
    "knives": "knife", "wives": "wife", "leaves": "leaf", "halves": "half",
}


def _base_form(word: str) -> str | None:
    """Reduce an inflected word to its base, when the base is itself a real word.

    The raw frequency list often ranks an inflection above its base ('things'
    before 'thing', 'called' before 'call'); the base makes the better flashcard.
    Returns None when there is no confident reduction.
    """
    if word in IRREGULAR_BASE:
        return IRREGULAR_BASE[word]

    candidates: list[str] = []
    if word.endswith("ies") and len(word) > 4:
        candidates.append(word[:-3] + "y")
    elif word.endswith(("sses", "shes", "ches")):
        candidates.append(word[:-2])
    elif word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        candidates.append(word[:-1])
    # Simple strips are tried before the doubled-consonant reduction: 'called' is
    # call+ed (-> 'call'), not cal+led, and only the base that is a real word wins.
    if word.endswith("ing") and len(word) > 5:
        candidates.extend([word[:-3], word[:-3] + "e"])
        if len(word) > 6 and word[-4] == word[-5]:  # running -> run
            candidates.append(word[:-4])
    if word.endswith("ed") and len(word) >= 4:
        candidates.extend([word[:-2], word[:-1]])
        if len(word) > 5 and word[-3] == word[-4]:  # stopped -> stop
            candidates.append(word[:-3])

    # Only accept a reduction to a solidly common English word, so we never
    # invent a "base" that isn't real (e.g. 'thing' yes, 'stat' from 'state' no).
    for candidate in candidates:
        if len(candidate) >= 3 and zipf_frequency(candidate, "en") >= 3.5:
            return candidate
    return None

# Suffixes stripped when checking whether a word is just an inflection of a word
# already accepted (years/year, running/run, said is handled by STOPWORDS).
def _candidate_stems(word: str) -> set[str]:
    stems: set[str] = set()
    w = word
    if w.endswith("ies") and len(w) > 4:
        stems.add(w[:-3] + "y")
    if w.endswith("es") and len(w) > 4:
        stems.add(w[:-2])
    if w.endswith("s") and len(w) > 3:
        stems.add(w[:-1])
    if w.endswith("ed") and len(w) >= 4:
        stems.update({w[:-2], w[:-1]})
    if w.endswith("ing") and len(w) > 5:
        stems.update({w[:-3], w[:-3] + "e"})
        # doubled consonant: running -> run
        if len(w) > 6 and w[-4] == w[-5]:
            stems.add(w[:-4])
    if w.endswith("est") and len(w) > 5:
        stems.update({w[:-3], w[:-2]})
    if w.endswith("er") and len(w) > 4:
        stems.update({w[:-2], w[:-1]})
    return stems


def frequency_concepts(n: int, skip: int = 0) -> list[str]:
    """The top `n` English content words by real-world usage, after `skip`.

    `skip` lets a deck continue past words an earlier/smaller run already used,
    so growing a deck pulls genuinely new words instead of re-emitting the top.
    """
    out: list[str] = []
    seen: set[str] = set()
    # Over-fetch: filtering removes a large fraction of the raw frequency list.
    for word in top_n_list("en", (n + skip) * 5 + 1000):
        w = word.strip().lower()
        if w in seen or w in STOPWORDS:
            continue
        if not w.isalpha() or len(w) < 3:
            continue
        # Prefer the base form when an inflection outranks it in the frequency list.
        w = _base_form(w) or w
        if w in seen or w in STOPWORDS:
            continue
        # Skip inflections of a word already taken (years/year, running/run) —
        # they make a near-duplicate flashcard rather than a new concept.
        if _candidate_stems(w) & (seen | STOPWORDS):
            continue
        seen.add(w)
        out.append(w)
        if len(out) >= n + skip:
            break
    return out[skip:]


def filter_real_words(words: list[str], zipf_floor: float = 1.0) -> list[str]:
    """Drop model-proposed concepts that don't exist in English usage data.

    Applied to themed concepts, which come from the model rather than from a
    corpus — this keeps obscure or invented picks out of the deck.
    """
    return [w for w in words if zipf_frequency(w, "en") >= zipf_floor]
