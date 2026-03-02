type YearSelectProps = {
  years: string[];
  value: string;
  onChange: (year: string) => void;
  label?: string;
};

export function YearSelect({ years, value, onChange, label = 'Academic year' }: YearSelectProps) {
  return (
    <label className="year-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {years.map((year) => (
          <option value={year} key={year}>
            {year}
          </option>
        ))}
      </select>
    </label>
  );
}
