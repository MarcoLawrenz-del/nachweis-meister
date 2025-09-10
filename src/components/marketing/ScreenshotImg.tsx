import * as React from "react";

export function ScreenshotImg({
  src, 
  src2x, 
  alt, 
  className
}: { 
  src: string; 
  src2x?: string; 
  alt: string; 
  className?: string; 
}) {
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-muted/40 rounded-xl ${className}`} 
        style={{aspectRatio:"16 / 9"}}
      >
        <span className="text-sm text-muted-foreground">Bild nicht verfügbar</span>
      </div>
    );
  }

  return (
    <picture>
      {src2x && <source srcSet={`${src2x} 2x, ${src} 1x`} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setError(true)}
        className={`w-full h-auto rounded-xl object-cover ${className || ""}`}
        style={{aspectRatio:"16 / 9"}}
      />
    </picture>
  );
}