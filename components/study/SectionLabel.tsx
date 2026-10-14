type SectionLabelProps = {
  number: "01" | "02" | "03" | "04" | "05";
  label: string;
};

export function SectionLabel({ number, label }: SectionLabelProps) {
  return (
    <div className="section-label">
      <span className="section-label__number">{number}</span>
      <span className="section-label__text">{label}</span>
      <span aria-hidden="true" className="section-label__rule" />
    </div>
  );
}
