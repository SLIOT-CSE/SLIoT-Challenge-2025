"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { portalRing } from "@/assets";
import { heroReadiness } from "@/lib/hero-readiness";
import { cn } from "@/lib/utils";

/**
 * Side portal rings for the hero backdrop. Reports load readiness to `heroReadiness`
 * so the first-visit preloader waits until the ring texture is decoded.
 */
export function HeroPortalRings() {
  const loadedCount = useRef(0);

  const markLoaded = () => {
    loadedCount.current += 1;
    heroReadiness.setRings(loadedCount.current >= 2 ? 1 : 0.5);
  };

  useEffect(() => {
    const imgs = document.querySelectorAll<HTMLImageElement>("[data-portal-ring-img]");
    let complete = 0;
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) complete += 1;
    });
    if (complete >= 2) heroReadiness.setRings(1);
    else if (complete === 1) heroReadiness.setRings(0.5);
  }, []);

  return (
    <>
      {(["left", "right"] as const).map((side) => (
        <div key={side} className={cn("portal-ring", side === "left" ? "portal-ring--left" : "portal-ring--right")}>
          <div data-portal-side={side} className="intro-fade relative size-full [--delay:0.4s]">
            <div className="portal-core">
              <div className="portal-eye" />
            </div>
            <Image
              src={portalRing}
              alt=""
              width={1200}
              height={1200}
              priority
              data-portal-ring-img
              onLoad={markLoaded}
              onError={markLoaded}
              sizes="(min-width: 640px) 46rem, 70vw"
              className="portal-spin size-full"
            />
          </div>
        </div>
      ))}
    </>
  );
}
