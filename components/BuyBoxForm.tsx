"use client";

import { useEffect, useRef, useState } from "react";
import { saveBuyBoxAction } from "@/lib/save-buy-box";

type Status = "idle" | "saving" | "saved" | "error";

export function BuyBoxForm({ children }: { children: React.ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number>(0);
  const seqRef = useRef(0);
  const [status, setStatus] = useState<Status>("idle");

  async function persist(form: HTMLFormElement) {
    const id = ++seqRef.current;
    const data = new FormData(form);
    setStatus("saving");
    try {
      const result = await saveBuyBoxAction(data);
      if (id !== seqRef.current) return;
      if (result?.ok) setStatus("saved");
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
      onInput={(event) => {
        if (event.target instanceof HTMLInputElement && event.target.name === "excludedCities") {
          schedule(event.currentTarget);
        }
      }}
      onSubmit={(event) => event.preventDefault()}
    >
      <p className="text-xs text-muted" aria-live="polite">
        {status === "saving"
          ? "Saving…"
          : status === "saved"
            ? "Saved"
            : status === "error"
              ? "Couldn’t save. Try that change again."
              : "Changes save as you go."}
      </p>
      {children}
    </form>
  );
}
