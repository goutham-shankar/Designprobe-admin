"use client";

import { useState, useEffect } from "react";

const KEY = "dp_admin_token";

export function useToken() {
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem(KEY) ?? "";
    setToken(stored);
  }, []);

  const save = (t: string) => {
    localStorage.setItem(KEY, t);
    setToken(t);
  };

  const clear = () => {
    localStorage.removeItem(KEY);
    setToken("");
  };

  return { token, save, clear };
}
