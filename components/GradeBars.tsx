import type { GradeResult } from "@/lib/types";

const ROWS: { key: keyof GradeResult["bars"]; label: string; weight: string }[] = [
  { key: "discount", label: "Discount vs AVM", weight: "35%" },
  { key: "rehab", label: "Rehab", weight: "20%" },
  { key: "layout", label: "Layout", weight: "15%" },
  { key: "trust", label: "Trust", weight: "20%" },
  { key: "time", label: "Time", weight: "10%" },
];

export function GradeBars({ grade }: { grade: GradeResult }) {
  return (
    <div className="space-y-3">
      {ROWS.map((row) => (
        <div key={row.key}>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>
              {row.label} <span className="text-muted font-medium">{row.weight}</span>
            </span>
            <span>{Math.round(grade.bars[row.key])}</span>
          </div>
          <div className="bar">
            <span style={{ width: `${Math.round(grade.bars[row.key])}%` }} />
          </div>
        </div>
      ))}
      <p className="text-[11px] text-muted leading-snug">
        Match tool, not an appraisal. Seller ARV is never treated as truth.
        {!grade.hasAvm ? " No platform AVM — A / A+ are locked." : null}
      </p>
    </div>
  );
}
