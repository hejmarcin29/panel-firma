"use client";

import { motion } from "framer-motion";
import { Check, Clock, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_STAGES, MOCK_LOGS } from "./data";

export function VerticalFeedVariant() {
  return (
    <div className="w-full max-w-md mx-auto bg-gray-50/50 min-h-[600px] p-4 rounded-xl border">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Wariant 2: Vertical Action Feed</h3>
        <p className="text-muted-foreground text-sm">
          Pionowa oś czasu z wyróżnioną kartą "Tu i Teraz".
        </p>
      </div>

      <div className="relative space-y-0">
        {/* Vertical Line */}
        <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200 -z-10" />

        {MOCK_STAGES.map((stage, index) => {
          const isCompleted = stage.status === "completed";
          const isCurrent = stage.status === "current";
          const stageLogs = MOCK_LOGS.filter(l => l.stageId === stage.id);

          if (isCompleted) {
            return (
              <div key={stage.id} className="flex gap-4 pb-8 opacity-60 hover:opacity-100 transition-opacity">
                <div className="w-12 flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center border border-green-200">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium text-sm text-gray-900">{stage.label}</h4>
                    <span className="text-xs text-muted-foreground">{stage.date}</span>
                  </div>
                  {/* Collapsed logs summary */}
                  <div className="text-xs text-muted-foreground truncate">
                    {stageLogs.length} zdarzeń • Ostatnie: {stageLogs[stageLogs.length - 1]?.action}
                  </div>
                </div>
              </div>
            );
          }

          if (isCurrent) {
            return (
              <motion.div 
                key={stage.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex gap-4 pb-8"
              >
                <div className="w-12 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200 ring-4 ring-white">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-lg border shadow-sm p-4 relative">
                    {/* Active Stage Card */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Badge variant="secondary" className="mb-1 bg-blue-50 text-blue-700 hover:bg-blue-50">
                          Aktualny Etap
                        </Badge>
                        <h3 className="font-bold text-lg text-gray-900">{stage.label}</h3>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                        24h
                      </span>
                    </div>

                    {/* Recent Logs in Active Card */}
                    <div className="space-y-3 mb-4">
                      {stageLogs.map(log => (
                        <div key={log.id} className="flex gap-2 text-sm bg-gray-50 p-2 rounded border border-gray-100">
                          {log.type === 'warning' ? (
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className="text-gray-700 leading-tight">{log.action}</p>
                            <span className="text-[10px] text-muted-foreground">{log.time} • {log.user}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Primary Action */}
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                      Zakończ Wycenę <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          }

          // Upcoming
          return (
            <div key={stage.id} className="flex gap-4 pb-8 opacity-40">
              <div className="w-12 flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300" />
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="font-medium text-sm text-gray-900">{stage.label}</h4>
                <p className="text-xs text-muted-foreground">Oczekuje na realizację</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
