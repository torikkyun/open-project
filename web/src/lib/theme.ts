export type Theme = "system" | "light" | "dark";

const storageKey = "open-project:theme";
const changeEvent = "open-project:theme-change";

export function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function writeTheme(theme: Theme) {
  window.localStorage.setItem(storageKey, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(changeEvent));
}

export function onThemeChange(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(changeEvent, listener);
  media.addEventListener("change", listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    media.removeEventListener("change", listener);
  };
}
