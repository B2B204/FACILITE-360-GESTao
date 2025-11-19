import React from "react";
import { BRAND } from "@/components/common/Branding";

export default function BrandLogo({ className = "", alt }) {
  return (
    <img
      src={BRAND.logoUrl}
      alt={alt || BRAND.name}
      loading="eager"
      decoding="async"
      fetchpriority="high"
      draggable="false" className="bg-white/0 text-[#000000] mx-1 my-1 px-1 h-8 sm:h-9 w-auto"

      style={{
        imageRendering: "crisp-edges",
        WebkitImageRendering: "crisp-edges",
        MsInterpolationMode: "bicubic",
        transform: "translateZ(0)"
      }} />);


}