
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Eraser, Check } from 'lucide-react';

interface SignatureDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (signatureDataUrl: string) => void;
}

export function SignatureDialog({ isOpen, onOpenChange, onConfirm }: SignatureDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [activeTab, setActiveTab] = useState('draw');
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      clearCanvas();
      setTypedSignature('');
      setIsSigned(false);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (activeTab === 'type') {
      redrawTypedSignature();
    }
  }, [typedSignature, activeTab]);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d');
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getMousePos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const pos = getMousePos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e.nativeEvent) {
      return {
        x: e.nativeEvent.touches[0].clientX - rect.left,
        y: e.nativeEvent.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setIsSigned(false);
    }
  };

  const redrawTypedSignature = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "italic 40px 'Parisienne', cursive"; // A nice cursive font
      ctx.fillStyle = "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
      setIsSigned(typedSignature.trim() !== '');
    }
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !isSigned) return;
    onConfirm(canvas.toDataURL('image/png'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provide Signature</DialogTitle>
          <DialogDescription>
            Please draw or type your signature below to accept the quote.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <style jsx global>{`
              @import url('https://fonts.googleapis.com/css2?family=Parisienne&display=swap');
            `}</style>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="draw">Draw</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
            </TabsList>
            <TabsContent value="draw">
                <canvas
                    ref={canvasRef}
                    width="400"
                    height="200"
                    className="border rounded-md w-full cursor-crosshair bg-white"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </TabsContent>
            <TabsContent value="type">
                 <canvas
                    ref={canvasRef} // We reuse the canvas for typed signature as well
                    width="400"
                    height="200"
                    className="border rounded-md w-full bg-white"
                />
              <Input
                type="text"
                placeholder="Type your name"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                className="mt-2 text-center text-2xl"
                style={{ fontFamily: "'Parisienne', cursive" }}
              />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="flex justify-between w-full">
            <Button variant="ghost" onClick={activeTab === 'draw' ? clearCanvas : () => setTypedSignature('')}>
                <Eraser className="mr-2 h-4 w-4" /> Clear
            </Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleConfirm} disabled={!isSigned}>
                    <Check className="mr-2 h-4 w-4" /> Accept & Sign
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
