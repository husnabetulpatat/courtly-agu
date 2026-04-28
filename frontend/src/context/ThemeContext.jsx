import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "courtly_theme";

const getSystemTheme = () => {
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

export const ThemeProvider = ({ children }) => {
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) || "light";
  });

  const appliedTheme = useMemo(() => {
    if (themePreference === "system") {
      return getSystemTheme();
    }

    return themePreference;
  }, [themePreference]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    document.documentElement.setAttribute("data-theme", appliedTheme);
  }, [themePreference, appliedTheme]);

  useEffect(() => {
    if (themePreference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      document.documentElement.setAttribute("data-theme", getSystemTheme());
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [themePreference]);

  const changeTheme = (nextTheme) => {
    setThemePreference(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        appliedTheme,
        changeTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};