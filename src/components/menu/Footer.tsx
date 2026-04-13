"use client";

export interface FooterProps {
  credits: string;
}

export function Footer({ credits }: FooterProps) {
  return (
    <footer className="absolute bottom-4 left-0 right-0 text-center">
      <p className="text-[8px] md:text-[10px] text-cream-300/60 tracking-wider">
        {credits}
      </p>
    </footer>
  );
}
