import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nn-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(0.55 0.13 55)" />
          <stop offset="0.55" stopColor="oklch(0.65 0.13 45)" />
          <stop offset="1" stopColor="oklch(0.70 0.13 65)" />
        </linearGradient>
      </defs>
      {/* Hourglass body */}
      <path
        d="M10 6 H38 V11 L29 24 L38 37 V42 H10 V37 L19 24 L10 11 Z"
        fill="url(#nn-grad)"
        opacity="0.18"
      />
      <path
        d="M10 6 H38 V11 L29 24 L38 37 V42 H10 V37 L19 24 L10 11 Z"
        stroke="url(#nn-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Heart in middle */}
      <path
        d="M24 22.5 C23 21 21 20.5 20 22 C19 23.5 19.5 25 24 28 C28.5 25 29 23.5 28 22 C27 20.5 25 21 24 22.5 Z"
        fill="url(#nn-grad)"
      />
      {/* Top sand */}
      <path d="M14 9 H34 L29 14 H19 Z" fill="url(#nn-grad)" opacity="0.4" />
      {/* Bottom sand */}
      <path d="M19 34 H29 L24 39 Z" fill="url(#nn-grad)" opacity="0.4" />
    </svg>
  );
}
