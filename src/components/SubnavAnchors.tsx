// ============= Sticky Sub-Navigation Component =============
// Anchor navigation for help pages

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
}

interface SubnavAnchorsProps {
  items: NavItem[];
  className?: string;
}

export function SubnavAnchors({ items, className }: SubnavAnchorsProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const sections = items.map(item => {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id: item.id,
            offsetTop: rect.top + scrollTop,
            element
          };
        }
        return null;
      }).filter(Boolean);

      // Find the currently visible section
      let currentSection = '';
      for (const section of sections) {
        if (section && scrollTop >= section.offsetTop - 140) {
          currentSection = section.id;
        }
      }
      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 140; // Account for main header + sticky subnav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn(
      "sticky top-20 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm",
      className
    )}>
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 py-3">
          {items.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "primary" : "ghost"}
              size="sm"
              onClick={() => scrollToSection(item.id)}
              className="h-8 text-sm"
            >
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Mobile Navigation - Horizontal Scroll */}
        <nav className="md:hidden">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {items.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "primary" : "outline"}
                size="sm"
                onClick={() => scrollToSection(item.id)}
                className="h-8 text-xs whitespace-nowrap flex-shrink-0"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}