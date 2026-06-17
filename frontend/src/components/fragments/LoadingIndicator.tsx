import { type FC, useEffect, useState } from "react";
import { Spinner } from "src/components/ui/spinner";
import { cn } from "src/lib/utils";

interface LoadingProps {
  message?: string;
  delay?: number;
}

const LoadingIndicator: FC<LoadingProps> = ({ message, delay = 100 }) => {
  const [delayed, setDelayed] = useState(delay > 0);
  useEffect(() => {
    if (!delayed || delay === 0) return;
    const timeout = setTimeout(() => setDelayed(false), delay);
    return () => clearTimeout(timeout);
  }, [delayed, delay]);

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 transition-opacity",
        delayed && "opacity-0",
      )}
    >
      <Spinner />
      <h4 className="text-lg text-muted-foreground">
        {message ?? "Loading..."}
      </h4>
    </div>
  );
};

export default LoadingIndicator;
