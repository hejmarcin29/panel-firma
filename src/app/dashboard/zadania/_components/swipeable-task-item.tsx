"use client";

import { motion, useMotionValue, PanInfo } from "framer-motion";
import { Check, Edit } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SwipeableTaskItemProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onEdit?: () => void;
  isCompleted?: boolean;
  className?: string;
}

export function SwipeableTaskItem({ children, onComplete, onEdit, className }: SwipeableTaskItemProps) {
  const x = useMotionValue(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    if (info.offset.x > 100 && onComplete) {
      onComplete();
    } else if (info.offset.x < -100 && onEdit) {
      onEdit();
    }
  };

  return (
    <div className="relative mb-3 select-none touch-pan-y">
      {/* Background Actions */}
      <div className="absolute inset-0 flex rounded-xl overflow-hidden">
        {/* Left side (Swipe Right) -> Complete */}
        <div className="flex-1 bg-emerald-600 flex items-center justify-start pl-6">
            <Check className="text-white h-6 w-6" />
        </div>
        {/* Right side (Swipe Left) -> Edit */}
        <div className="flex-1 bg-blue-600 flex items-center justify-end pr-6">
            <Edit className="text-white h-6 w-6" />
        </div>
      </div>

      {/* Foreground Card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1} // Less elastic to feel more "solid" until threshold
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        className={cn("relative bg-card border rounded-xl shadow-sm z-10", className)}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
