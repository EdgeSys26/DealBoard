"use client";

import { PHOTO_NEW } from "@/lib/listing-photos";

export function ListingPhoto({
  src,
  className,
  alt = "",
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={(event) => {
        if (event.currentTarget.src !== PHOTO_NEW) {
          event.currentTarget.src = PHOTO_NEW;
        }
      }}
    />
  );
}
