import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleIconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  'aria-label'?: string;
  decorative?: boolean;
  focusable?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4', // 16px
  md: 'h-5 w-5', // 20px - default
  lg: 'h-6 w-6', // 24px
  xl: 'h-8 w-8'  // 32px
};

export function AccessibleIcon({
  icon: Icon,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  decorative = false,
  focusable = false,
  ...props
}: AccessibleIconProps) {
  const iconProps = {
    className: cn(sizeMap[size], className),
    'aria-hidden': decorative ? true : undefined,
    'aria-label': !decorative && ariaLabel ? ariaLabel : undefined,
    focusable: focusable,
    role: !decorative && !ariaLabel ? 'img' : undefined,
    ...props
  };

  return <Icon {...iconProps} />;
}

// Helper function to create consistent icon usage
export function createIconComponent(
  icon: LucideIcon, 
  defaultLabel?: string,
  defaultDecorative = false
) {
  return function IconComponent({
    'aria-label': ariaLabel = defaultLabel,
    decorative = defaultDecorative,
    ...props
  }: Omit<AccessibleIconProps, 'icon'>) {
    return (
      <AccessibleIcon
        icon={icon}
        aria-label={ariaLabel}
        decorative={decorative}
        {...props}
      />
    );
  };
}