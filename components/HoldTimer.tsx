"use client";

import { useEffect, useState } from "react";

export function HoldTimer({ expiresAt }: { expiresAt: Date | string }) {
  const [left, setLeft] = useState(() => remaining(expiresAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(remaining(expiresAt)), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (left <= 0) {
    return <p className="text-sm font-semibold text-red-600">Hold dropped</p>;
  }
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <p className="text-sm font-semibold text-accent">
      Soft hold {h}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </p>
  );
}

function remaining(expiresAt: Date | string) {
  return new Date(expiresAt).getTime() - Date.now();
}
