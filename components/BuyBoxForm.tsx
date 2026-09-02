"use client";

import { useEffect, useRef, useState } from "react";
import { saveBuyBoxAction } from "@/lib/save-buy-box";

type Status = "idle" | "saving" | "saved" | "work" | "error";

export function BuyBoxForm({ children }: { children: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number>(0);
  const seqRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");

  async function persist(form: HTMLFormElement) {
    const id = ++seqRef.current;
    const data = new FormData(form);
    if (!data.getAll("workLevels").length) {
      setStatus("work");
      return;
    }
    setStatus("saving");
    try {
      const result = await saveBuyBoxAction(data);
      if (id !== seqRef.current) return;
      if (result?.ok) setStatus("saved");
      else if (result?.reason === "work") setStatus("work");
      else setStatus("error");
    } catch {
      if (id !== seqRef.current) return;
      setStatus("error");
    }
  }

  function schedule(form: HTMLFormElement) {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      void persist(form);
    }, 450);
  }

  function flush() {
    const form = formRef.current;
    if (!form) return;
    window.clearTimeout(timerRef.current);
    void persist(form);
  }

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <form
      ref={formRef}
      className="buybox-form"
      onChange={(event) => schedule(event.currentTarget)}
      onBlur={(event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLSelectElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          flush();
        }
      }}
      onSubmit={(event) => event.preventDefault()}
    >
      <p className="text-xs text-muted" aria-live="polite">
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : status === "work"
              ? "Pick at least one in I’ll take."
              : status === "error"
                ? "Couldn’t save. Try that change again."
                : "Changes save as you go."}
      </p>
      {children}
    </form>
  );
}
