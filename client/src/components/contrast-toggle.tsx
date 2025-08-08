import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContrast } from "@/hooks/use-contrast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ContrastToggle() {
  const { contrastMode, toggleContrast } = useContrast();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleContrast}
            className="relative"
            aria-label={
              contrastMode === "high" 
                ? "Tắt chế độ tăng độ tương phản" 
                : "Bật chế độ tăng độ tương phản"
            }
          >
            {contrastMode === "high" ? (
              <Eye className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <EyeOff className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">
              {contrastMode === "high" 
                ? "Tắt chế độ tăng độ tương phản" 
                : "Bật chế độ tăng độ tương phản"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {contrastMode === "high" 
              ? "Tắt chế độ tăng độ tương phản" 
              : "Bật chế độ tăng độ tương phản"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}