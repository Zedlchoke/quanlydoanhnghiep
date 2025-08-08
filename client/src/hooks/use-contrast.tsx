import { createContext, useContext, useEffect, useState } from "react";

type ContrastMode = "normal" | "high";

type ContrastProviderProps = {
  children: React.ReactNode;
  defaultContrast?: ContrastMode;
  storageKey?: string;
};

type ContrastProviderState = {
  contrastMode: ContrastMode;
  setContrastMode: (contrastMode: ContrastMode) => void;
  toggleContrast: () => void;
};

const initialState: ContrastProviderState = {
  contrastMode: "normal",
  setContrastMode: () => null,
  toggleContrast: () => null,
};

const ContrastProviderContext = createContext<ContrastProviderState>(initialState);

export function ContrastProvider({
  children,
  defaultContrast = "normal",
  storageKey = "vite-ui-contrast",
  ...props
}: ContrastProviderProps) {
  const [contrastMode, setContrastMode] = useState<ContrastMode>(
    () => (localStorage.getItem(storageKey) as ContrastMode) || defaultContrast
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("normal", "high");

    if (contrastMode === "high") {
      root.classList.add("high");
    }
  }, [contrastMode]);

  const value = {
    contrastMode,
    setContrastMode: (contrastMode: ContrastMode) => {
      localStorage.setItem(storageKey, contrastMode);
      setContrastMode(contrastMode);
    },
    toggleContrast: () => {
      const newMode = contrastMode === "normal" ? "high" : "normal";
      localStorage.setItem(storageKey, newMode);
      setContrastMode(newMode);
    },
  };

  return (
    <ContrastProviderContext.Provider {...props} value={value}>
      {children}
    </ContrastProviderContext.Provider>
  );
}

export const useContrast = () => {
  const context = useContext(ContrastProviderContext);

  if (context === undefined)
    throw new Error("useContrast must be used within a ContrastProvider");

  return context;
};