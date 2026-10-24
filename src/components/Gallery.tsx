import { useEffect } from "react";
import PhotoSwipeLightbox from "photoswipe/lightbox";
import "photoswipe/style.css";
export default function Gallery({
  images,
}: {
  images: { src: string; width: number; height: number }[];
}) {
  useEffect(() => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: "#gallery",
      children: "a",
      pswpModule: () => import("photoswipe"),
      spacing: 0.5,
      loop: false,
    });
    lightbox.init();
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !lightbox.pswp) return;
      const pswp = lightbox.pswp;
      if (pswp.opener.isOpen) pswp.close();
      else {
        const close = () => {
          pswp.off("openingAnimationEnd", close);
          pswp.close();
        };
        pswp.on("openingAnimationEnd", close);
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("keydown", escape);
      lightbox.destroy();
    };
  }, []);
  return (
    <div
      id="gallery"
      className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-center"
    >
      {images.map((image, index) => (
        <a
          key={image.src}
          href={image.src}
          target="_blank"
          rel="noreferrer"
          data-pswp-width={image.width}
          data-pswp-height={image.height}
          className="flex border-2 border-slate-200 dark:border-slate-700 rounded-md overflow-hidden sm:max-h-60 shadow-sm hover:shadow-lg items-center justify-center"
        >
          <img
            src={image.src}
            width="300"
            height={Math.round((300 * image.height) / image.width)}
            alt={"Vinařství Nová Hora – " + (index + 1)}
            loading="lazy"
            className="w-full h-auto"
          />
        </a>
      ))}
    </div>
  );
}
