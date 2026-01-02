import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, FlipHorizontal, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ScannerInputProps {
  onCapture: (imageData: string) => void;
  disabled?: boolean;
}

export const ScannerInput = ({ onCapture, disabled }: ScannerInputProps) => {
  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasPermission(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const toggleCamera = () => {
    if (isActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const flipCamera = async () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    
    if (isActive) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        onCapture(imageData);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Camera Scanner</h3>
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-muted">
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-video w-full object-cover"
            />
            <motion.div
              className="pointer-events-none absolute inset-0 border-2 border-primary/50"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            {/* Scan line animation */}
            <motion.div
              className="pointer-events-none absolute left-0 right-0 h-0.5 bg-primary"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
          </>
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <div className="text-center">
              <CameraOff className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {hasPermission === false 
                  ? "Camera access denied" 
                  : "Camera is off"}
              </p>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={toggleCamera}
          disabled={disabled}
          variant={isActive ? "destructive" : "default"}
          className="gap-2"
        >
          {isActive ? (
            <>
              <CameraOff className="h-4 w-4" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Start Camera
            </>
          )}
        </Button>

        {isActive && (
          <>
            <Button
              onClick={flipCamera}
              disabled={disabled}
              variant="outline"
              size="icon"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>

            <Button
              onClick={captureImage}
              disabled={disabled}
              className="gap-2"
            >
              <Scan className="h-4 w-4" />
              Capture
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
