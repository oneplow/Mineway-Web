"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function setDocumentTheme(attribute, resolvedTheme, disableTransitionOnChange) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  let styleNode = null;

  if (disableTransitionOnChange) {
    styleNode = document.createElement("style");
    styleNode.appendChild(document.createTextNode("*{transition:none!important}"));
    document.head.appendChild(styleNode);
  }

  if (attribute === "class") {
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  } else {
    root.setAttribute(attribute, resolvedTheme);
  }

  if (styleNode) {
    void window.getComputedStyle(document.body);
    requestAnimationFrame(() => {
      styleNode?.remove();
    });
  }
}

function getInitialTheme(defaultTheme, storageKey) {
  if (typeof window === "undefined") {
    return defaultTheme;
  }

  return window.localStorage.getItem(storageKey) || defaultTheme;
}

function resolveTheme(theme, enableSystem) {
  return theme === "system" && enableSystem ? getSystemTheme() : theme;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
  storageKey = "theme",
}) {
  const [theme, setThemeState] = useState(() => getInitialTheme(defaultTheme, storageKey));
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(
    getInitialTheme(defaultTheme, storageKey),
    enableSystem
  ));

  useEffect(() => {
    setDocumentTheme(attribute, resolvedTheme, disableTransitionOnChange);

    if (!enableSystem) {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (event) => {
      const systemTheme = event.matches ? "dark" : "light";
      if (theme === "system") {
        setResolvedTheme(systemTheme);
        setDocumentTheme(attribute, systemTheme, disableTransitionOnChange);
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [attribute, disableTransitionOnChange, enableSystem, resolvedTheme, theme]);

  const setTheme = (nextTheme) => {
    const normalizedTheme = nextTheme || defaultTheme;
    const nextResolvedTheme = resolveTheme(normalizedTheme, enableSystem);

    window.localStorage.setItem(storageKey, normalizedTheme);
    setThemeState(normalizedTheme);
    setResolvedTheme(nextResolvedTheme);
    setDocumentTheme(attribute, nextResolvedTheme, disableTransitionOnChange);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        systemTheme: enableSystem ? getSystemTheme() : undefined,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
