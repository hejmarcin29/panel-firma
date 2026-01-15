"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function AnnouncementBarClient({ message }: { message: string }) {
  const [isVisible, setIsVisible] = useState(true);

  // Opcjonalnie: Logic to persist dismissal
  // useEffect(() => {
  //   const hidden = sessionStorage.getItem("announcement-hidden");
  //   if (hidden === message) setIsVisible(false);
  // }, [message]);

  if (!isVisible) return null;

  return (
    <div className="relative bg-[#a93226] text-white px-4 py-2 text-center text-sm font-medium z-50">
      <div className="container mx-auto">
        <p>{message}</p>
        <button 
            onClick={() => setIsVisible(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Zamknij"
        >
            <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
