import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ dark: false, toggleTheme: () => { } });

export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(() => {
        try {
            return localStorage.getItem("theme") === "dark";
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
        try {
            localStorage.setItem("theme", dark ? "dark" : "light");
        } catch { }
    }, [dark]);

    const toggleTheme = () => setDark((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ dark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
