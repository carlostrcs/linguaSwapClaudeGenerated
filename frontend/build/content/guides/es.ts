// Spanish guides. Mirrors `en.ts` key for key.
import type { Guide } from './types';

const LINKS = {
  'spaced-repetition': 'Cómo funciona la repetición espaciada',
  'leitner-boxes': 'El sistema Leitner, explicado',
  'how-many-words': '¿Cuántas palabras necesitas de verdad?',
};

const guides: Guide[] = [
  {
    key: 'spaced-repetition',
    title: 'Cómo funciona la repetición espaciada (y por qué releer no sirve) | LinguaSwap',
    description:
      'La repetición espaciada programa cada palabra para repasarla justo antes de que la olvides. Aquí tienes el mecanismo, por qué releer parece productivo pero no lo es, y cómo aplicarlo al vocabulario.',
    heading: 'Cómo funciona la repetición espaciada',
    lede:
      'La repetición espaciada consiste en repasar algo a intervalos cada vez más largos, calculados para que cada repaso llegue justo antes de que lo hubieras olvidado. Es el cambio con más impacto que casi cualquier persona puede hacer en su forma de aprender vocabulario.',
    sections: [
      {
        heading: 'El problema es la curva del olvido',
        paragraphs: [
          'La memoria de un dato aislado se degrada rápido y de forma predecible. Aprende una palabra hoy y, sin refuerzo, la mayor parte habrá desaparecido en pocos días. Apréndela y repásala mañana, y la caída se ralentiza. Repásala otra vez unos días después, y se ralentiza aún más. Cada recuerdo exitoso aplana la curva.',
          'La consecuencia práctica es que el momento del repaso importa más que la cantidad. Veinte minutos repartidos en cinco días superan a cien minutos de una sentada, porque cada una de esas cinco sesiones alcanza la memoria en el punto en que recuperarla cuesta esfuerzo pero todavía es posible.',
        ],
      },
      {
        heading: 'Por qué releer parece funcionar',
        paragraphs: [
          'Leer una lista de palabras una y otra vez produce una fuerte sensación de familiaridad, y la familiaridad se confunde fácilmente con el conocimiento. La prueba no es si reconoces la respuesta cuando la ves: es si puedes producirla cuando no la tienes delante.',
          'Por eso la práctica eficaz de vocabulario te obliga a escribir la respuesta en lugar de revelarla. Lo que refuerza la memoria es la recuperación; el reconocimiento sobre todo refuerza tu confianza.',
        ],
      },
      {
        heading: 'Qué hace realmente un programador de repasos',
        paragraphs: [
          'Un sistema de repetición espaciada registra, palabra por palabra, cuánto la dominas y cuándo deberías volver a verla. Si aciertas, el siguiente intervalo crece. Si fallas, se desploma a algo corto, porque un fallo significa que la memoria era más débil de lo que el calendario suponía.',
          'El efecto al cabo de unas semanas es que tu cola de repaso se llena discretamente con las palabras que te cuestan, mientras que las que has aprendido de verdad pasan a revisiones ocasionales. Inviertes el tiempo donde cambia el resultado.',
          'LinguaSwap usa un sistema Leitner: el programador más sencillo que funciona bien, cinco cajas y una sola regla de ascenso.',
        ],
      },
      {
        heading: 'Aplicarlo al vocabulario en concreto',
        paragraphs: [
          'El vocabulario es casi el caso ideal para la repetición espaciada: muchos elementos pequeños e independientes, cada uno recordado o no. Es exactamente la forma en la que la técnica es más fuerte.',
          'Hay dos cosas que conviene hacer bien. Primero, practica en la dirección que realmente necesitas: reconocer una palabra en español al leer es una habilidad distinta de producirla al hablar, y por eso LinguaSwap sigue cada dirección por separado. Segundo, sesiones cortas y frecuentes; el trabajo lo hace el calendario, no la duración de la sesión.',
          'También merece la pena añadir una nota a cualquier palabra cuya traducción resulte engañosa por sí sola. Una aclaración como «la sensación de pertenencia, no el edificio» es la diferencia entre memorizar una correspondencia y aprender una palabra.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuánto debe durar una sesión de repetición espaciada?',
        a: 'De diez a quince minutos al día es más eficaz que una hora una vez por semana. El sistema decide qué palabras tocan; tu única tarea es aparecer con la frecuencia suficiente para despacharlas.',
      },
      {
        q: '¿Es mejor la repetición espaciada que las tarjetas de memoria?',
        a: 'La repetición espaciada es un método de programación y las tarjetas son un formato: funcionan juntos. Unas tarjetas de papel repasadas en orden fijo carecen de la programación, que es de donde viene casi todo el beneficio.',
      },
      {
        q: '¿Qué pasa cuando fallo una palabra?',
        a: 'En un sistema Leitner la palabra vuelve a la primera caja y reaparece muy pronto. Es intencionado: un fallo demuestra que el intervalo se había alargado demasiado.',
      },
      {
        q: '¿Funciona la repetición espaciada con la gramática y las frases hechas?',
        a: 'Funciona con todo lo que se pueda comprobar recordando, incluidas frases hechas y colocaciones. Es más débil con las destrezas que exigen producir en contexto, como la conversación, así que complementa la práctica oral en lugar de sustituirla.',
      },
    ],
    faqHeading: "Preguntas frecuentes",
    moreHeading: 'Más guías',
    linkLabels: LINKS,
  },
  {
    key: 'leitner-boxes',
    title: 'El sistema Leitner explicado: cinco cajas, una regla | LinguaSwap',
    description:
      'El sistema Leitner es el programador de repetición espaciada más sencillo que funciona. Cinco cajas, una regla de ascenso y un intervalo de repaso que crece a medida que la palabra se te da mejor.',
    heading: 'El sistema Leitner, explicado',
    lede:
      'El sistema Leitner es un programador de repetición espaciada que podrías montar con cinco cajas de zapatos y un taco de fichas. Es lo bastante simple para explicarlo en un párrafo y lo bastante bueno como para que el software lo siga usando cincuenta años después.',
    sections: [
      {
        heading: 'La regla',
        paragraphs: [
          'Cada palabra vive en una de cinco cajas. Una palabra nueva empieza en la caja 1. Si la aciertas, sube una caja. Si la fallas, vuelve directa a la caja 1, por muy alto que hubiera llegado.',
          'Cada caja tiene un intervalo de repaso más largo que la anterior. La caja 1 vuelve casi de inmediato; la caja 5 puede no volver en semanas. Así, una palabra que aciertas siempre deja rápidamente de ocuparte tiempo, y una que fallas sigue reapareciendo hasta que se queda.',
        ],
      },
      {
        heading: 'Por qué el reinicio es tan drástico',
        paragraphs: [
          'Devolver una palabra hasta la caja 1 por un solo fallo parece duro, y es la parte que la gente más quiere suavizar. Merece la pena mantenerla.',
          'Una palabra en la caja 4 que acabas de fallar estaba, por definición, mal programada: el sistema creía que la sabías y no era así. La forma más barata de recuperarse de una estimación errónea es tirarla y volver a medir. Suavizar el reinicio produce sobre todo una cola llena de palabras que crees saber.',
        ],
      },
      {
        heading: 'Qué significa «dominada»',
        paragraphs: [
          'En LinguaSwap una palabra que llega a la caja 5 cuenta como dominada, y la página de estadísticas indica cuántas de tus palabras lo han conseguido. La posición en las cajas se muestra como una escala de rojo a verde, así que una biblioteca mayoritariamente verde es una que has aprendido de verdad, no simplemente vista.',
          'El dominio es por dirección. Una palabra puede estar en la caja 5 de español a inglés y en la caja 1 de inglés a español, porque producir una palabra es más difícil que reconocerla. Tratarlas como un solo número sería halagarte.',
        ],
      },
      {
        heading: 'Cuándo usar algo distinto del calendario',
        paragraphs: [
          'El calendario optimiza la retención a largo plazo, que es el objetivo equivocado la víspera de un examen. Para eso están los demás modos de práctica: Repaso rápido recorre toda la biblioteca ignorando el calendario y, deliberadamente, no registra cambios de caja, de modo que una sesión de última hora no corrompe semanas de datos.',
          'Del mismo modo, Palabras difíciles saca primero las cajas más bajas y los fallos más frecuentes cuando quieres atacar los puntos débiles, y Recorrido avanza por una biblioteca grande de principio a fin, desbloqueando palabras nuevas solo a medida que dominas el conjunto actual.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuántas cajas Leitner debe haber?',
        a: 'Cinco es la elección habitual y la que usa LinguaSwap. Más cajas dan intervalos más finos pero tardan más en mover una palabra; menos hacen los saltos demasiado bruscos.',
      },
      {
        q: '¿Por qué un fallo devuelve la ficha a la caja 1?',
        a: 'Porque el fallo demuestra que el intervalo actual era demasiado largo. Reiniciar es la forma más barata de volver a medir cuánto se sabe realmente la palabra.',
      },
      {
        q: '¿El sistema Leitner tolera las erratas?',
        a: 'LinguaSwap corrige los espacios sobrantes y normaliza Unicode antes de evaluar, y no distingue mayúsculas salvo cuando son gramaticales, como en alemán. Los acentos siempre cuentan, porque un acento forma parte de la palabra.',
      },
    ],
    faqHeading: "Preguntas frecuentes",
    moreHeading: 'Más guías',
    linkLabels: LINKS,
  },
  {
    key: 'how-many-words',
    title: '¿Cuántas palabras hacen falta para hablar un idioma? | LinguaSwap',
    description:
      'Unas 300 palabras cubren una parte sorprendente del habla cotidiana, 1000 te permiten conversar y 3000 te dejan cómodo. Qué significan esas cifras y cómo elegir qué palabras estudiar.',
    heading: '¿Cuántas palabras necesitas de verdad?',
    lede:
      'La frecuencia de las palabras es muy desigual: un número pequeño de palabras hace una parte enorme del trabajo en el habla cotidiana. Ese es el dato más útil para cualquiera que esté decidiendo por dónde empezar.',
    sections: [
      {
        heading: 'Las cifras aproximadas',
        paragraphs: [
          'Unas 300 palabras bien elegidas cubren buena parte de la conversación cotidiana: las palabras funcionales, los verbos más comunes y el puñado de sustantivos que no dejan de aparecer. Unas 1000 bastan para mantener una conversación sencilla y seguir el hilo de la mayoría del habla informal. Alrededor de 3000 es donde la mayoría deja de sentirse perdida, y a partir de ahí el rendimiento se aplana hacia vocabulario de ámbitos concretos.',
          'Son aproximaciones y varían según el idioma y según lo que quieras hacer. Pero la forma es fiable: las primeras mil palabras compran mucha más comprensión por palabra que las cuatro mil.',
        ],
      },
      {
        heading: 'Cobertura no es lo mismo que fluidez',
        paragraphs: [
          'Conocer las palabras que forman el 80 % de una conversación no significa entender el 80 % de ella. El 20 % que falta no está repartido de forma uniforme: se concentra justo en las palabras de contenido que sostienen el significado de la frase.',
          'Por eso las listas de frecuencia son un punto de partida y no un plan. Te llevan al nivel en el que puedes empezar a adquirir el resto por contexto, que es de donde acaba viniendo casi todo el crecimiento real del vocabulario.',
        ],
      },
      {
        heading: 'Elige primero por frecuencia y luego por tema',
        paragraphs: [
          'El orden más eficiente es: primero el núcleo de alta frecuencia y después lo que necesites en concreto. Quien está a punto de viajar necesita vocabulario de aeropuerto y direcciones antes que el adjetivo número 900 en frecuencia; quien lee prensa no necesita ninguno de los dos.',
          'LinguaSwap incluye los dos tipos de lista. Las bibliotecas de las 300 y las 1000 palabras más comunes están ordenadas por frecuencia de uso real, y las bibliotecas temáticas —viajes, comida, trabajo, salud y las demás— cubren las situaciones para las que la gente se prepara de verdad.',
        ],
      },
      {
        heading: 'Un ritmo realista',
        paragraphs: [
          'De diez a quince palabras nuevas al día, repasadas con un calendario espaciado, es un ritmo que casi cualquiera puede sostener. Son unas 1000 palabras en tres meses de práctica constante, suficiente para cambiar lo que puedes hacer con el idioma.',
          'El fallo típico no es aprender demasiado despacio, sino añadir palabras nuevas más rápido de lo que repasas las viejas, hasta que la cola crece y practicar se vuelve una obligación. Añadir palabras nuevas solo cuando el conjunto actual está bajo control es exactamente lo que impone el modo Recorrido.',
        ],
      },
    ],
    faq: [
      {
        q: '¿Cuántas palabras hacen falta para tener fluidez?',
        a: 'No hay un umbral único, pero la mayoría de las estimaciones sitúan una fluidez cotidiana cómoda entre 3000 y 5000 palabras, con las primeras 1000 haciendo una parte desproporcionada del trabajo.',
      },
      {
        q: '¿Cuántas palabras debería aprender al día?',
        a: 'De diez a quince palabras nuevas al día es sostenible para la mayoría, además de los repasos. El límite es la capacidad de repaso, no cuántas palabras nuevas puedes absorber de una sentada.',
      },
      {
        q: '¿Debo aprender primero las palabras más comunes?',
        a: 'Para la comprensión general, sí: el orden por frecuencia da más entendimiento por palabra aprendida. Si tienes una necesidad concreta y cercana, como un viaje, el vocabulario temático es mejor primera inversión.',
      },
    ],
    faqHeading: "Preguntas frecuentes",
    moreHeading: 'Más guías',
    linkLabels: LINKS,
  },
];

export default guides;
