"use client";

import { useRouter } from "next/navigation";

export function ClickRow({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      className="listing-row cursor-pointer"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("a, button, input, select, textarea, label, form")) return;
        router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
