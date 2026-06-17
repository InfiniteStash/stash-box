import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";

import { Icon } from "src/components/fragments";
import Image from "src/components/image";
import { Button } from "src/components/ui/button";
import type { ImageFragment } from "src/graphql";

type ImageType = Pick<ImageFragment, "id" | "url" | "width" | "height">;

interface ImageProps {
  image: ImageType;
  lightboxImages?: ImageType[];
  onRemove: () => void;
  showCategorization?: boolean;
}

const ImageInput: FC<ImageProps> = ({ image, lightboxImages, onRemove, showCategorization }) => (
  <div className="relative">
    <Button
      variant="danger"
      size="sm"
      className="absolute right-2 top-2 z-10"
      onClick={() => onRemove()}
    >
      <Icon icon={faXmark} />
    </Button>
    <Image
      images={image}
      className="max-h-96 w-full object-contain"
      lightboxImages={lightboxImages}
      showCategorization={showCategorization}
      size={300}
    />
    <div className="text-center text-sm text-muted-foreground">
      {image.width} x {image.height}
    </div>
  </div>
);

export default ImageInput;
