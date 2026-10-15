/**
 * PLM themes — provider + Appearance picker (React 18).
 * Load tokens.css, then themes.css, once. The active theme is an attribute on <html>: data-theme="<id>".
 * Saved per user in localStorage — replace with your user-settings API when available.
 */
import * as React from "react";

export const THEMES = [
  { id: "lavender", name: "Lavender", mode: "light", description: "The default. Soft lavender gradient, warm greys.", swatch: ["#6F5CC9", "#B2A5EA", "#F5F3FD", "#FAF8F9"] },
  { id: "lavender-dark", name: "Lavender · dark", mode: "dark", description: "The default palette on a deep aubergine ground.", swatch: ["#B2A5EA", "#C9BFF2", "#241F2A", "#100D13"] },
  { id: "midnight", name: "Midnight", mode: "dark", description: "Dark mode in deep navy with periwinkle accents \u2014 easy on the eyes all day.", swatch: ["#7C9CFF", "#A5B8FF", "#18223A", "#0B1020"] },
  { id: "bubblegum", name: "Bubblegum", mode: "light", description: "Candy pink, light and playful \u2014 rose gradient on blush white.", swatch: ["#CC3379", "#F48FB8", "#FFE4EF", "#FFF5F9"] },
  { id: "ocean", name: "Ocean", mode: "light", description: "Clear blue, crisp and corporate.", swatch: ["#1D6FD8", "#5AA2F0", "#EAF3FE", "#F5F9FC"] },
  { id: "olive", name: "Olive", mode: "light", description: "Light olive green \u2014 fresh and natural, dark labels on a soft olive gradient.", swatch: ["#A9B65E", "#D4DC9C", "#F1F4E0", "#F7F8F1"] },
  { id: "graphite", name: "Graphite", mode: "light", description: "Monochrome and minimal \u2014 ink-black actions, no colour noise.", swatch: ["#27272A", "#71717A", "#F1F1F3", "#F7F7F8"] },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "lavender";
const DARK_FALLBACK: ThemeId = "lavender-dark";

const KEY = "plm.theme";
const KEY_SYS = "plm.theme.followSystem";
const LEGACY: Record<string, ThemeId> = { sage: "olive", light: "lavender", dark: "lavender-dark" };

const isDark = (id: ThemeId) => THEMES.find((t) => t.id === id)?.mode === "dark";
const normalize = (v: string | null): ThemeId | null => {
  if (!v) return null;
  const id = (LEGACY[v] ?? v) as ThemeId;
  return THEMES.some((t) => t.id === id) ? id : null;
};

/** Resolve what to paint: the user's pick, or its dark fallback when following a dark OS setting. */
export function resolveTheme(pick: ThemeId, followSystem: boolean, systemDark: boolean): ThemeId {
  return followSystem && systemDark && !isDark(pick) ? DARK_FALLBACK : pick;
}

function apply(id: ThemeId) { document.documentElement.setAttribute("data-theme", id); }

/** Inline this in <head> (before CSS paints) to avoid a flash of the default theme. */
export const NO_FLASH_SCRIPT = `try{var L={sage:"olive",light:"lavender",dark:"lavender-dark"};var t=localStorage.getItem("${KEY}")||"lavender";t=L[t]||t;var d=["lavender-dark","midnight"];if(localStorage.getItem("${KEY_SYS}")==="1"&&matchMedia("(prefers-color-scheme: dark)").matches&&d.indexOf(t)<0)t="lavender-dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

interface Ctx { theme: ThemeId; resolved: ThemeId; setTheme: (t: ThemeId) => void; followSystem: boolean; setFollowSystem: (v: boolean) => void }
const ThemeContext = React.createContext<Ctx | null>(null);

export function ThemeProvider({ children, initialTheme }: { children: React.ReactNode; initialTheme?: ThemeId }) {
  const [theme, setThemeState] = React.useState<ThemeId>(() => {
    try { return normalize(localStorage.getItem(KEY)) ?? initialTheme ?? DEFAULT_THEME; } catch { return initialTheme ?? DEFAULT_THEME; }
  });
  const [followSystem, setFollow] = React.useState(() => { try { return localStorage.getItem(KEY_SYS) === "1"; } catch { return false; } });
  const [systemDark, setSystemDark] = React.useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setSystemDark(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const resolved = resolveTheme(theme, followSystem, systemDark);
  React.useEffect(() => apply(resolved), [resolved]);

  const setTheme = (t: ThemeId) => { setThemeState(t); try { localStorage.setItem(KEY, t); } catch {} };
  const setFollowSystem = (v: boolean) => { setFollow(v); try { localStorage.setItem(KEY_SYS, v ? "1" : "0"); } catch {} };
  return <ThemeContext.Provider value={{ theme, resolved, setTheme, followSystem, setFollowSystem }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const c = React.useContext(ThemeContext);
  if (!c) throw new Error("useTheme must be used inside <ThemeProvider>");
  return c;
}

/** Content of the "Appearance" popover (account menu → Appearance). */
export function ThemePicker() {
  const { theme, setTheme, followSystem, setFollowSystem } = useTheme();
  return (
    <div className="theme-picker">
      <div role="radiogroup" aria-label="Theme" className="theme-grid">
        {THEMES.map((t) => (
          <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} className="theme-tile" onClick={() => setTheme(t.id)}>
            <span className="theme-swatch" aria-hidden>{t.swatch.map((c) => <span key={c} style={{ background: c }} />)}</span>
            <span className="theme-row"><b>{t.name}</b><span className="theme-mode">{t.mode === "dark" ? "Dark" : "Light"}</span></span>
            <span className="theme-desc">{t.description}</span>
          </button>
        ))}
      </div>
      <label className="theme-follow">
        <input type="checkbox" role="switch" checked={followSystem} onChange={(e) => setFollowSystem(e.target.checked)} />
        Follow the system’s light / dark setting
      </label>
    </div>
  );
}
