"use client";

import Image from "next/image";

export interface PixelBackgroundProps {
  floorSrc: string;
  overlayOpacity?: number;
}

export function PixelBackground({
  floorSrc,
  overlayOpacity = 0.6,
}: PixelBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Tiled floor background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${floorSrc})`,
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Decorative furniture elements */}
      <div className="absolute top-8 left-8 opacity-60">
        <Image
          src="/assets/furniture/bookshelf.png"
          alt=""
          width={64}
          height={64}
          className="drop-shadow-md"
        />
      </div>
      <div className="absolute top-8 right-8 opacity-60">
        <Image
          src="/assets/furniture/plant.png"
          alt=""
          width={32}
          height={32}
          className="drop-shadow-md"
        />
      </div>
      <div className="absolute bottom-32 left-1/4 opacity-40">
        <Image
          src="/assets/furniture/armchair.png"
          alt=""
          width={32}
          height={32}
          className="drop-shadow-md"
        />
      </div>
      <div className="absolute top-1/3 right-1/4 opacity-40">
        <Image
          src="/assets/furniture/desk.png"
          alt=""
          width={32}
          height={32}
          className="drop-shadow-md"
        />
      </div>

      {/* Mystery weapon hint */}
      <div className="absolute bottom-16 right-1/3 opacity-30 rotate-45">
        <Image
          src="/assets/weapons/knife.png"
          alt=""
          width={32}
          height={16}
          className="drop-shadow-lg"
        />
      </div>

      {/* Dark overlay for readability */}
      <div
        className="absolute inset-0 bg-wood-900"
        style={{ opacity: overlayOpacity }}
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(45, 27, 14, 0.4) 70%, rgba(45, 27, 14, 0.8) 100%)",
        }}
      />
    </div>
  );
}
