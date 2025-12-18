import { JSX, createSignal, createEffect } from "solid-js";
import { Theme, ThemeContext } from "./context";

export function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setTheme] = createSignal<Theme>(
    (localStorage.getItem("theme") as Theme) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", newTheme);
      return newTheme;
    });
  };

  createEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme());
  });

  return (
    <ThemeContext.Provider
      value={{
        theme: theme(),
        toggleTheme,
        setTheme,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}
