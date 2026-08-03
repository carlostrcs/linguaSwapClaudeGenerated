// French guides. Mirrors `en.ts` key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'Comment fonctionne la répétition espacée',
  'leitner-boxes': 'Le système Leitner, expliqué',
  'how-many-words': 'De combien de mots avez-vous vraiment besoin ?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'Comment fonctionne la répétition espacée (et pourquoi relire ne marche pas) | LinguaSwap',
    description:
      "La répétition espacée programme chaque mot pour une révision juste avant que vous ne l'oubliiez. Voici le mécanisme, pourquoi relire semble productif sans l'être, et comment l'appliquer au vocabulaire.",
    heading: 'Comment fonctionne la répétition espacée',
    lede:
      "La répétition espacée consiste à réviser à intervalles croissants, calculés pour que chaque révision arrive juste avant que vous n'ayez oublié. C'est le changement le plus rentable que la plupart des gens puissent apporter à leur façon d'apprendre du vocabulaire.",
    sections: [
      {
        heading: "Le problème, c'est la courbe de l'oubli",
        paragraphs: [
          "La mémoire d'un fait isolé se dégrade vite et de façon prévisible. Apprenez un mot aujourd'hui et, sans renforcement, l'essentiel aura disparu en quelques jours. Apprenez-le et révisez-le demain, et la chute ralentit. Révisez-le encore quelques jours plus tard, et elle ralentit davantage. Chaque rappel réussi aplatit la courbe.",
          "La conséquence pratique est que le moment de la révision compte plus que la quantité. Vingt minutes réparties sur cinq jours battent cent minutes d'affilée, parce que chacune de ces cinq séances attrape la mémoire au point où la retrouver demande un effort mais reste possible.",
        ],
      },
      {
        heading: 'Pourquoi relire donne le sentiment de fonctionner',
        paragraphs: [
          "Lire une liste de mots encore et encore produit un fort sentiment de familiarité, et la familiarité se confond aisément avec la connaissance. Le test n'est pas de savoir si vous reconnaissez la réponse quand vous la voyez, mais si vous pouvez la produire quand vous ne l'avez pas sous les yeux.",
          "C'est pourquoi une pratique efficace vous fait taper la réponse au lieu de la dévoiler. Ce qui renforce la mémoire, c'est la récupération ; la reconnaissance renforce surtout votre confiance.",
        ],
      },
      {
        heading: 'Ce que fait réellement un planificateur',
        paragraphs: [
          "Un système de répétition espacée suit, mot par mot, à quel point vous le maîtrisez et quand vous devriez le revoir. Bonne réponse : l'intervalle suivant s'allonge. Mauvaise réponse : il s'effondre à quelque chose de court, car un échec signifie que la mémoire était plus fragile que le calendrier ne le supposait.",
          "Au bout de quelques semaines, votre file de révision se remplit discrètement des mots qui vous résistent, tandis que ceux que vous avez vraiment appris passent à des vérifications occasionnelles. Vous passez votre temps là où cela change le résultat.",
          "LinguaSwap utilise un système Leitner : le planificateur le plus simple qui fonctionne bien, cinq boîtes et une seule règle de promotion.",
        ],
      },
      {
        heading: 'Appliqué au vocabulaire en particulier',
        paragraphs: [
          "Le vocabulaire est presque le cas idéal : un grand nombre d'éléments petits et indépendants, chacun retrouvé ou non. C'est exactement la forme sur laquelle la technique est la plus forte.",
          "Deux points méritent d'être bien réglés. D'abord, entraînez-vous dans le sens dont vous avez réellement besoin : reconnaître un mot espagnol en lisant est une compétence différente de le produire en parlant, et c'est pour cela que LinguaSwap suit chaque sens séparément. Ensuite, des séances courtes et fréquentes ; le travail est fait par le calendrier, pas par la durée.",
          "Il vaut aussi la peine d'ajouter une note à tout mot dont la traduction seule induit en erreur. Une précision comme « le sentiment d'appartenance, pas le bâtiment » fait la différence entre mémoriser une correspondance et apprendre un mot.",
        ],
      },
    ],
    faq: [
      {
        q: 'Combien de temps doit durer une séance de répétition espacée ?',
        a: "Dix à quinze minutes par jour sont plus efficaces qu'une heure une fois par semaine. Le système décide quels mots sont dus ; votre seul travail est de venir assez souvent pour les traiter.",
      },
      {
        q: 'La répétition espacée est-elle meilleure que les cartes mémoire ?',
        a: "La répétition espacée est une méthode de planification et les cartes un format : les deux vont ensemble. Des cartes papier révisées dans un ordre fixe n'ont pas la planification, d'où vient pourtant l'essentiel du bénéfice.",
      },
      {
        q: "Que se passe-t-il quand je me trompe sur un mot ?",
        a: "Dans un système Leitner, le mot redescend à la première boîte et revient très vite. C'est voulu : un échec prouve que l'intervalle était devenu trop long.",
      },
      {
        q: 'La répétition espacée marche-t-elle pour la grammaire et les expressions ?',
        a: "Elle marche pour tout ce qui se teste par le rappel, y compris les expressions figées et les collocations. Elle est plus faible pour les compétences qui exigent de produire en contexte, comme la conversation : c'est un complément à la pratique orale, pas un remplacement.",
      },
    ],
    faqHeading: "Questions fréquentes",
    moreHeading: 'Autres guides',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'Le système Leitner expliqué : cinq boîtes, une règle | LinguaSwap',
    description:
      "Le système Leitner est le planificateur de répétition espacée le plus simple qui fonctionne. Cinq boîtes, une règle de promotion, et un intervalle qui s'allonge à mesure que le mot devient facile.",
    heading: 'Le système Leitner, expliqué',
    lede:
      "Le système Leitner est un planificateur de répétition espacée que vous pourriez faire tourner avec cinq boîtes à chaussures et un paquet de fiches. Assez simple pour tenir en un paragraphe, et assez bon pour que les logiciels l'utilisent encore cinquante ans plus tard.",
    sections: [
      {
        heading: 'La règle',
        paragraphs: [
          "Chaque mot vit dans l'une des cinq boîtes. Un mot nouveau démarre dans la boîte 1. Bonne réponse : il monte d'une boîte. Mauvaise réponse : il retourne directement à la boîte 1, quelle que soit la hauteur atteinte.",
          "Chaque boîte a un intervalle plus long que la précédente. La boîte 1 revient presque immédiatement ; la boîte 5 peut ne pas revenir avant des semaines. Un mot que vous réussissez cesse donc vite de vous prendre du temps, et un mot que vous ratez continue de revenir jusqu'à ce qu'il tienne.",
        ],
      },
      {
        heading: 'Pourquoi la remise à zéro est si brutale',
        paragraphs: [
          "Renvoyer un mot jusqu'à la boîte 1 pour une seule erreur paraît sévère, et c'est la partie que l'on veut le plus souvent adoucir. Elle mérite d'être gardée.",
          "Un mot en boîte 4 que vous venez de rater était, par définition, mal programmé : le système croyait que vous le saviez, et non. Le moyen le moins coûteux de corriger une mauvaise estimation est de la jeter et de remesurer. Adoucir la remise à zéro produit surtout une file pleine de mots que vous croyez connaître.",
        ],
      },
      {
        heading: 'Ce que « maîtrisé » veut dire',
        paragraphs: [
          "Dans LinguaSwap, un mot qui atteint la boîte 5 compte comme maîtrisé, et la page de statistiques indique combien de vos mots y sont arrivés. La position est affichée sur une échelle du rouge au vert : une bibliothèque majoritairement verte est une bibliothèque réellement apprise, pas simplement vue.",
          "La maîtrise est par sens. Un mot peut être en boîte 5 de l'espagnol vers l'anglais et en boîte 1 de l'anglais vers l'espagnol, parce que produire un mot est plus difficile que le reconnaître. En faire un seul chiffre reviendrait à se flatter.",
        ],
      },
      {
        heading: 'Quand utiliser autre chose que le calendrier',
        paragraphs: [
          "Le calendrier optimise la rétention à long terme, ce qui est le mauvais objectif la veille d'un examen. C'est à cela que servent les autres modes : Révision express parcourt toute la bibliothèque en ignorant le calendrier et, délibérément, n'enregistre pas les changements de boîte, pour qu'une séance de panique ne corrompe pas des semaines de données.",
          "De même, Mots difficiles remonte d'abord les boîtes les plus basses et les erreurs les plus fréquentes quand vous voulez attaquer vos points faibles, et Parcours traverse une grande bibliothèque de bout en bout, ne débloquant de nouveaux mots qu'une fois l'ensemble courant maîtrisé.",
        ],
      },
    ],
    faq: [
      {
        q: 'Combien de boîtes Leitner faut-il ?',
        a: "Cinq est le choix courant et celui de LinguaSwap. Plus de boîtes donnent des intervalles plus fins mais ralentissent la progression d'un mot ; moins rendent les sauts trop grossiers.",
      },
      {
        q: 'Pourquoi une mauvaise réponse renvoie-t-elle la carte en boîte 1 ?',
        a: "Parce que l'échec prouve que l'intervalle actuel était trop long. Repartir de zéro est le moyen le moins coûteux de remesurer ce que le mot vaut réellement.",
      },
      {
        q: 'Le système Leitner tolère-t-il les fautes de frappe ?',
        a: "LinguaSwap évalue après avoir supprimé les espaces superflus et normalisé l'Unicode, et ignore la casse sauf lorsqu'elle est grammaticale, comme en allemand. Les accents comptent toujours, car un accent fait partie du mot.",
      },
    ],
    faqHeading: "Questions fréquentes",
    moreHeading: 'Autres guides',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: 'Combien de mots faut-il pour parler une langue ? | LinguaSwap',
    description:
      "Environ 300 mots couvrent une part surprenante du langage courant, 1000 permettent de converser, 3000 mettent à l'aise. Ce que signifient ces chiffres, et comment choisir quels mots apprendre.",
    heading: 'De combien de mots avez-vous vraiment besoin ?',
    lede:
      "La fréquence des mots est très inégale : un petit nombre de mots fait une très grande part du travail dans la langue de tous les jours. C'est le fait le plus utile pour qui décide par où commencer.",
    sections: [
      {
        heading: 'Les ordres de grandeur',
        paragraphs: [
          "Environ 300 mots bien choisis couvrent une large part de la conversation quotidienne : les mots grammaticaux, les verbes les plus courants et la poignée de noms qui reviennent sans cesse. Environ 1000 suffisent à tenir une conversation simple et à suivre l'essentiel du langage informel. Autour de 3000, la plupart des gens cessent de se sentir perdus ; au-delà, les gains s'aplatissent vers du vocabulaire de domaine.",
          "Ce sont des approximations, variables selon la langue et selon l'objectif. Mais la forme est fiable : les mille premiers mots achètent bien plus de compréhension par mot que les quatre millièmes.",
        ],
      },
      {
        heading: "La couverture n'est pas la fluidité",
        paragraphs: [
          "Connaître les mots qui composent 80 % d'une conversation ne veut pas dire en comprendre 80 %. Les 20 % manquants ne sont pas répartis uniformément : ils se concentrent précisément sur les mots de contenu qui portent le sens de la phrase.",
          "C'est pourquoi les listes de fréquence sont un point de départ et non un plan. Elles vous amènent au niveau où vous pouvez acquérir le reste par le contexte, d'où vient finalement l'essentiel de la croissance du vocabulaire.",
        ],
      },
      {
        heading: "Choisir d'abord par fréquence, puis par thème",
        paragraphs: [
          "L'ordre le plus efficace : le noyau à haute fréquence d'abord, puis ce dont vous avez précisément besoin. Qui part en voyage a besoin du vocabulaire de l'aéroport et des directions avant du 900e adjectif le plus courant ; qui lit la presse n'a besoin ni de l'un ni de l'autre.",
          "LinguaSwap propose les deux types de liste. Les bibliothèques des 300 et 1000 mots les plus courants sont classées par fréquence d'usage réel, et les bibliothèques thématiques — voyage, cuisine, travail, santé et les autres — couvrent les situations auxquelles on se prépare vraiment.",
        ],
      },
      {
        heading: 'Un rythme réaliste',
        paragraphs: [
          "Dix à quinze mots nouveaux par jour, révisés selon un calendrier espacé, est un rythme tenable pour la plupart. Cela fait environ 1000 mots en trois mois de pratique régulière — de quoi changer ce que vous pouvez faire avec la langue.",
          "Le vrai échec n'est pas d'apprendre trop lentement, c'est d'ajouter des mots plus vite qu'on ne révise les anciens, jusqu'à ce que la file grossisse et que la pratique devienne une corvée. N'ajouter des mots que lorsque l'ensemble courant est sous contrôle est précisément ce qu'impose le mode Parcours.",
        ],
      },
    ],
    faq: [
      {
        q: 'Combien de mots faut-il pour être à l’aise dans une langue ?',
        a: "Il n'y a pas de seuil unique, mais la plupart des estimations situent une aisance quotidienne confortable entre 3000 et 5000 mots, les 1000 premiers faisant une part disproportionnée du travail.",
      },
      {
        q: 'Combien de mots apprendre par jour ?',
        a: "Dix à quinze mots nouveaux par jour restent tenables pour la plupart, révisions comprises. Le facteur limitant est la capacité de révision, pas le nombre de mots absorbables d'un coup.",
      },
      {
        q: 'Faut-il apprendre les mots les plus courants en premier ?',
        a: "Pour la compréhension générale, oui : l'ordre de fréquence donne le plus de compréhension par mot appris. Si vous avez un besoin précis et proche, comme un voyage, le vocabulaire thématique est le meilleur premier investissement.",
      },
    ],
    faqHeading: "Questions fréquentes",
    moreHeading: 'Autres guides',
    linkLabels: LINKS,
  },
];

export default guides;
