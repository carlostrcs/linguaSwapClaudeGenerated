interface Props {
  hint: string;
}

/**
 * Displays the answer hint as a row of character boxes: revealed letters are shown,
 * blanks ('_') render as empty boxes, and spaces become gaps. Display only.
 */
export default function HintGuide({ hint }: Props) {
  return (
    <div className="hint-guide" aria-hidden="true">
      {[...hint].map((ch, i) => {
        if (ch === ' ') return <span className="hint-space" key={i} />;
        if (ch === '_') return <span className="hint-box hint-blank" key={i} />;
        return (
          <span className="hint-box hint-filled" key={i}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}
