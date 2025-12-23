"use client";

import { useSystemAvatar } from "@/components/providers/system-avatar-provider";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function SystemAvatar() {
  const { message, dismiss } = useSystemAvatar();

  // Jeśli nie ma wiadomości, nie renderujemy nic (lub renderujemy samego avatara w stanie spoczynku)
  // Tutaj zrobimy, że avatar pojawia się tylko gdy ma coś do powiedzenia, 
  // albo jest zawsze widoczny jako mała ikona.
  // Zróbmy wersję "zawsze widoczny", ale dymek pojawia się dynamicznie.

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className={cn(
              "pointer-events-auto relative max-w-[300px] rounded-2xl p-4 shadow-lg border",
              "bg-white dark:bg-zinc-900 dark:border-zinc-800",
              message.type === "error" && "border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900",
              message.type === "success" && "border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900",
              message.type === "warning" && "border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900"
            )}
          >
            <button 
              onClick={dismiss}
              className="absolute -top-2 -right-2 p-1 bg-white dark:bg-zinc-800 rounded-full border shadow-sm hover:bg-zinc-100"
            >
              <X className="w-3 h-3" />
            </button>
            <p className="text-sm font-medium leading-relaxed">
              {message.text}
            </p>
            
            {/* Strzałka dymku */}
            <div className={cn(
              "absolute -bottom-2 right-6 w-4 h-4 rotate-45 border-b border-r bg-inherit",
              "bg-white dark:bg-zinc-900",
              message.type === "error" && "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
              message.type === "success" && "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
              message.type === "warning" && "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
            )} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        className="pointer-events-auto relative group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
            // Kliknięcie w avatara może np. powtórzyć ostatnią wiadomość lub otworzyć menu
            if (!message) {
                // Przykładowa interakcja
                // say("Jestem gotowy do pracy! 👋");
            }
        }}
      >
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center text-white overflow-hidden border-2 border-white dark:border-zinc-800">
            {/* Można tu dać obrazek */}
            <span className="text-xl">🤖</span>
        </div>
        <div className="absolute inset-0 rounded-full ring-2 ring-blue-500/20 animate-pulse" />
      </motion.div>
    </div>
  );
}
