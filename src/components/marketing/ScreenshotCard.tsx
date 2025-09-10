import { SCREENSHOTS } from "@/content/screenshots";
import { ScreenshotImg } from "./ScreenshotImg";

interface ScreenshotCardProps {
  k: keyof typeof SCREENSHOTS;
  title: string;
  href?: string;
}

export function ScreenshotCard({ k, title, href }: ScreenshotCardProps) {
  const s = SCREENSHOTS[k];
  
  const content = (
    <>
      <ScreenshotImg src={s.src} src2x={s.src2x} alt={s.alt} />
      <div className="mt-3">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-base font-medium">{s.caption}</div>
      </div>
    </>
  );

  return (
    <div className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
      {href ? (
        <a href={href} aria-label={title} className="block">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}