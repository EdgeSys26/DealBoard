export function CheckRows({
  name,
  options,
  checked,
}: {
  name: string;
  options: { value: string; label: string }[];
  checked: string[];
}) {
  return (
    <div className="check-rows">
      {options.map((option) => (
        <label key={option.value} className="check-row">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={checked.includes(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
