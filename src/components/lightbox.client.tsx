"use client";
import React from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export function ImageLightbox({
  images,
  open,
  onClose,
}: {
  images: { src: string; title?: string }[];
  open: boolean;
  onClose: () => void;
}) {
  const slides = images.map((i) => ({ src: i.src, description: i.title }));
  return <Lightbox open={open} close={onClose} slides={slides} />;
}

export default ImageLightbox;
