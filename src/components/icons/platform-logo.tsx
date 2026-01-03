import { cn } from '@/lib/utils';

type PlatformLogoProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function PlatformLogo({
  size = 44,
  className,
  title,
}: PlatformLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 199 148.82"
      fill="none"
      className={cn('text-black dark:text-white', className)}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      focusable={false}
    >
      {title ? <title>{title}</title> : null}
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-current text-2xl font-bold"
      >
        MONTEVELORIS
      </text>
    </svg>
  );
}




