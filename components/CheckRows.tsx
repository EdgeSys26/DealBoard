export function CheckRows({
  name,
  options,
  checked,
  type = "checkbox",
}: {
  name: string;
  options: { value: string; label: string }[];
  checked: string[];
  type?: "checkbox" | "radio";
}) {
  return (
    <div className="check-rows">
      {options.map((option) => (
        <label key={option.value} className="check-row">
          <input
            type={type}
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
