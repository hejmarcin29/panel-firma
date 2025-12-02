import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Wczytywanie panelu...</p>
    </div>
  );
}
