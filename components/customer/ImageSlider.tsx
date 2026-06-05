import type { ProductImage } from "@/lib/supabase/types";

export function ImageSlider({ images }: { images: ProductImage[] }) {
  if (images.length === 0) {
    return <div className="aspect-square w-full bg-gray-100" />;
  }

  return (
    <div className="flex w-full snap-x snap-mandatory overflow-x-auto">
      {images.map((image) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image.id}
          src={image.image_url}
          alt=""
          className="aspect-square w-full flex-none snap-center object-cover"
        />
      ))}
    </div>
  );
}
