// English guides. The other locales mirror this file's structure key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'How spaced repetition works',
  'leitner-boxes': 'The Leitner system, explained',
  'how-many-words': 'How many words do you actually need?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'How spaced repetition works — and why re-reading does not | LinguaSwap',
    description:
      'Spaced repetition schedules each word for review just before you would forget it. Here is the mechanism, why re-reading feels productive but is not, and how to use it for vocabulary.',
    heading: 'How spaced repetition works',
    lede:
      'Spaced repetition is the practice of reviewing something at growing intervals, timed so each review lands just before you would have forgotten it. It is the single highest-leverage change most people can make to how they learn vocabulary.',
    sections: [
      {
        heading: 'The forgetting curve is the problem',
        paragraphs: [
          'Memory for an isolated fact decays quickly and predictably. Learn a word today and, without reinforcement, most of it is gone within days. Learn it and review it tomorrow, and the decay slows. Review it again a few days later, and it slows further. Each successful recall flattens the curve.',
          'The practical consequence is that the timing of review matters more than the amount. Twenty minutes spread across five days beats a hundred minutes in one sitting, because each of the five sessions catches the memory at the point where retrieving it is effortful but still possible.',
        ],
      },
      {
        heading: 'Why re-reading feels like it works',
        paragraphs: [
          'Reading a word list over and over produces a strong feeling of familiarity, and familiarity is easy to mistake for knowledge. The test is not whether you recognise the answer when you see it — it is whether you can produce it when you do not.',
          'That is why effective vocabulary practice makes you type the answer rather than reveal it. Retrieval is the thing that strengthens the memory; recognition mostly strengthens your confidence.',
        ],
      },
      {
        heading: 'What a scheduler actually does',
        paragraphs: [
          'A spaced-repetition scheduler tracks, per word, how well you know it and when you should next see it. Answer correctly and the next interval grows. Answer wrongly and it collapses back to something short, because a failed recall means the memory was weaker than the schedule assumed.',
          'The effect over a few weeks is that your review queue quietly fills with the words you find hard, while the ones you have genuinely learned drop to occasional check-ins. You spend your time where it changes the outcome.',
          'LinguaSwap uses a Leitner system — the simplest scheduler that works well, five boxes with one promotion rule.',
        ],
      },
      {
        heading: 'Using it for vocabulary specifically',
        paragraphs: [
          'Vocabulary is close to the ideal case for spaced repetition: a large number of small, independent items, each either recalled or not. That is exactly the shape the technique is strongest on.',
          'Two things are worth getting right. First, practise in the direction you actually need — recognising a Spanish word when reading is a different skill from producing it when speaking, and LinguaSwap tracks each direction separately for that reason. Second, keep sessions short and frequent; the schedule does the work, not the session length.',
          'It is also worth adding a note to any word whose translation is misleading on its own. A gloss like "the feeling of belonging, not the building" is the difference between memorising a mapping and learning a word.',
        ],
      },
    ],
    faq: [
      {
        q: 'How long should a spaced repetition session be?',
        a: 'Ten to fifteen minutes daily is more effective than an hour once a week. The scheduler decides which words are due; your job is only to show up often enough to clear them.',
      },
      {
        q: 'Is spaced repetition better than flashcards?',
        a: 'Spaced repetition is a scheduling method, and flashcards are a format — the two work together. Paper flashcards reviewed in a fixed order lack the scheduling, which is where most of the benefit comes from.',
      },
      {
        q: 'What happens when I get a word wrong?',
        a: 'In a Leitner system the word drops back to the first box and comes back very soon. That is intended: a failed recall is evidence that the interval had grown too long.',
      },
      {
        q: 'Does spaced repetition work for grammar and phrases?',
        a: 'It works for anything that can be tested by recall, including set phrases and collocations. It is weakest for skills that need production in context, like conversation, which is why it is a supplement to speaking practice rather than a replacement.',
      },
    ],
    faqHeading: "Common questions",
    moreHeading: 'More guides',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'The Leitner system explained: five boxes, one rule | LinguaSwap',
    description:
      'The Leitner system is the simplest spaced-repetition scheduler that works. Five boxes, one promotion rule, and a review interval that grows as a word gets easier.',
    heading: 'The Leitner system, explained',
    lede:
      'The Leitner system is a spaced-repetition scheduler you could run with five shoeboxes and a stack of cards. It is simple enough to explain in a paragraph and good enough that software still uses it fifty years later.',
    sections: [
      {
        heading: 'The rule',
        paragraphs: [
          'Every word lives in one of five boxes. A new word starts in box 1. Answer it correctly and it moves up one box. Answer it wrongly and it goes straight back to box 1, no matter how high it had climbed.',
          'Each box has a longer review interval than the one below it. Box 1 comes back almost immediately; box 5 might not come back for weeks. So a word you keep getting right rapidly stops taking up your time, and a word you keep failing keeps reappearing until it sticks.',
        ],
      },
      {
        heading: 'Why the reset is so aggressive',
        paragraphs: [
          'Dropping a word all the way to box 1 on a single mistake looks harsh, and it is the part people most often want to soften. It is worth keeping.',
          'A word in box 4 that you just failed was, by definition, scheduled wrongly — the system believed you knew it and you did not. The cheapest way to recover from a bad estimate is to throw it away and re-measure. Softening the reset mostly produces a queue full of words you believe you know.',
        ],
      },
      {
        heading: 'What "mastered" means',
        paragraphs: [
          'In LinguaSwap a word that reaches box 5 counts as mastered, and the statistics page reports how many of your words have got there. Box position is shown as a red-to-green ramp, so a library that is mostly green is one you have genuinely learned rather than one you have merely seen.',
          'Mastery is per direction. A word can sit in box 5 for Spanish to English and box 1 for English to Spanish, because producing a word is a harder skill than recognising it. Treating those as one number would flatter you.',
        ],
      },
      {
        heading: 'When to use something other than the schedule',
        paragraphs: [
          'The schedule optimises for long-term retention, which is the wrong objective the night before an exam. That is what the other practice modes are for: Cram runs the whole library ignoring the schedule, and deliberately does not record box changes, so a panic session does not corrupt weeks of scheduling data.',
          'Similarly, Weak Words pulls the lowest boxes and most-missed items first when you want to attack trouble spots directly, and Journey walks a large library end to end, unlocking new words only as the current set is mastered.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many Leitner boxes should there be?',
        a: 'Five is the common choice and what LinguaSwap uses. More boxes give finer-grained intervals but take longer to move a word through; fewer make the jumps too coarse.',
      },
      {
        q: 'Why does a wrong answer send the card back to box 1?',
        a: 'Because the failure is evidence that the current interval was too long. Resetting is the cheapest way to re-measure how well the word is actually known.',
      },
      {
        q: 'Does the Leitner system handle typos?',
        a: 'LinguaSwap grades answers after trimming whitespace and normalising Unicode, and is case-insensitive except where capitalisation is grammatical, as in German. Accents are always significant, because an accent is part of the word.',
      },
    ],
    faqHeading: "Common questions",
    moreHeading: 'More guides',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: 'How many words do you need to speak a language? | LinguaSwap',
    description:
      'Roughly 300 words cover a surprising share of everyday speech, 1,000 gets you conversational, and 3,000 gets you comfortable. What those numbers mean, and how to choose which words.',
    heading: 'How many words do you actually need?',
    lede:
      'Word frequency is steep: a small number of words does a very large share of the work in everyday speech. That is the single most useful fact for anyone deciding what to study first.',
    sections: [
      {
        heading: 'The rough numbers',
        paragraphs: [
          'Around 300 well-chosen words cover a large share of everyday conversation — the function words, the most common verbs, and the handful of nouns that keep coming up. Around 1,000 is enough to hold a simple conversation and follow the gist of most casual speech. Around 3,000 is where most people stop feeling lost, and beyond that returns flatten out into vocabulary for specific domains.',
          'These are approximations and they vary by language and by what you want to do. But the shape is reliable: the first thousand words buy far more comprehension per word than the fourth thousand.',
        ],
      },
      {
        heading: 'Coverage is not the same as fluency',
        paragraphs: [
          'Knowing the words that make up 80% of a conversation does not mean understanding 80% of it. The missing 20% is not evenly distributed — it clusters on exactly the content words that carry the meaning of the sentence.',
          'This is why frequency lists are a starting point rather than a plan. They get you to the level where you can start acquiring the rest from context, which is where most real vocabulary growth eventually comes from.',
        ],
      },
      {
        heading: 'Choose by frequency first, then by topic',
        paragraphs: [
          'The most efficient order is: high-frequency core first, then whatever you specifically need. Someone about to travel needs airport and directions vocabulary sooner than they need the 900th most common adjective; someone reading news needs neither.',
          'LinguaSwap ships both kinds of list. The 300 and 1,000 most common word libraries are ranked by real-world usage frequency, and the topic libraries — travel, food, work, health and the rest — cover the situations people actually prepare for.',
        ],
      },
      {
        heading: 'A realistic pace',
        paragraphs: [
          'Ten to fifteen new words a day, reviewed on a spaced schedule, is a pace most people can sustain. That is roughly 1,000 words in three months of consistent practice — enough to change what you can do with the language.',
          'The failure mode is not learning too slowly; it is adding new words faster than you review old ones, so the review queue grows until practice feels like a chore. Adding new words only when the current set is under control is exactly what the Journey mode enforces.',
        ],
      },
    ],
    faq: [
      {
        q: 'How many words do you need to be fluent?',
        a: 'There is no single threshold, but most estimates put comfortable everyday fluency somewhere between 3,000 and 5,000 words, with the first 1,000 doing a disproportionate share of the work.',
      },
      {
        q: 'How many words should I learn per day?',
        a: 'Ten to fifteen new words a day is sustainable for most people alongside reviews. The limiting factor is review capacity, not how many new words you can absorb in one sitting.',
      },
      {
        q: 'Should I learn the most common words first?',
        a: 'For general comprehension, yes — frequency order gives the most understanding per word learned. If you have a specific near-term need, such as a trip, topic vocabulary is the better first investment.',
      },
    ],
    faqHeading: "Common questions",
    moreHeading: 'More guides',
    linkLabels: LINKS,
  },
];

export default guides;
