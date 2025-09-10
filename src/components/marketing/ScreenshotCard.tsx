import { SCREENSHOTS } from "@/content/screenshots";

interface ScreenshotCardProps {
  k: keyof typeof SCREENSHOTS;
  title: string;
  href?: string;
}

export function ScreenshotCard({ k, title, href }: ScreenshotCardProps) {
  const s = SCREENSHOTS[k];
  
  const img = (
    <picture>
      <source srcSet={`${s.src2x} 2x, ${s.src} 1x`} />
      <img 
        src={s.src} 
        alt={s.alt} 
        loading="lazy" 
        className="w-full h-44 object-cover rounded-xl" 
      />
    </picture>
  );

  return (
    <div className="rounded-2xl border p-4 bg-card hover:shadow-sm transition-shadow">
      {href ? (
        <a href={href} aria-label={title} className="block">
          {img}
        </a>
      ) : (
        img
      )}
      <div className="mt-3">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-base font-medium">{s.caption}</div>
      </div>
    </div>
  );
}