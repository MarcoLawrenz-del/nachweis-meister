import { useTheme } from "next-themes";
import { BRAND } from "@/config/brand";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'light' | 'dark' | 'auto';
}

export function Logo({ className = "", width = 160, height = 48, variant = 'auto' }: LogoProps) {
  const { theme, systemTheme } = useTheme();
  
  const getLogoSrc = () => {
    if (variant === 'light') return BRAND.logo.light;
    if (variant === 'dark') return BRAND.logo.dark;
    
    // Auto mode - determine based on theme
    const currentTheme = theme === 'system' ? systemTheme : theme;
    return currentTheme === 'dark' ? BRAND.logo.dark : BRAND.logo.light;
  };

  return (
    <img
      src={getLogoSrc()}
      alt={BRAND.name}
      className={`h-auto ${className}`}
      width={width}
      height={height}
      style={{ width: `${width}px`, height: `${height}px` }}
    />
  );
}