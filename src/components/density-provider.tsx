"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { setDensityCookie } from "./actions";

type Density = "comfortable" | "compact";

interface DensityContextType {
  density: Density;
  setDensity: (density: Density) => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export function DensityProvider({
  children,
  initialDensity = "comfortable",
}: {
  children: React.ReactNode;
  initialDensity?: Density;
}) {
  const [density, setDensityState] = useState<Density>(initialDensity);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-density", density);
  }, [density]);

  const setDensity = (newDensity: Density) => {
    setDensityState(newDensity);
    setDensityCookie(newDensity);
  };

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  const context = useContext(DensityContext);
  if (context === undefined) {
    throw new Error("useDensity must be used within a DensityProvider");
  }
  return context;
}
