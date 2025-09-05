import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Pen } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signature: string | undefined) => void;
}

export default function SignaturePad({ onSignatureChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 120;

    // Set drawing style
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Fill with white background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.nativeEvent.offsetX;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.nativeEvent.offsetY;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);

    // Immediate signature update for better responsiveness
    // High quality PNG conversion
    const signature = canvas.toDataURL('image/png', 1.0);
    onSignatureChange(signature);
    console.log('🖋️ İmza canvastan alındı:', signature ? signature.substring(0, 50) + '...' : 'NULL');
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSignatureChange(undefined);
    console.log('İmza temizlendi');
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-border rounded-lg p-2 bg-background">
        <canvas
          ref={canvasRef}
          className="border border-border rounded cursor-crosshair w-full"
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          data-testid="canvas-signature"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Pen className="w-3 h-3" />
          <span>İmza için yukarıya çizin</span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={!hasSignature}
          data-testid="button-clear-signature"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Temizle
        </Button>
      </div>
    </div>
  );
}
