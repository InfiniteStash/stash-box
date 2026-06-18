import type { FC } from "react";
import { DeletedImage } from "src/components/fragments";
import ImageComponent from "src/components/image";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
};

const CLASSNAME = "ImageChangeRow";

export interface ImageChangeRowProps {
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const Images: FC<{
  images: (Image | null)[] | null | undefined;
}> = ({ images }) => {
  const lightboxImages = (images ?? []).filter((image) => image !== null);

  return (
    <div className="flex flex-wrap">
      {(images ?? []).map((image, i) =>
        image === null ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: Image is deleted, no other key
          <DeletedImage key={`deleted-${i}`} />
        ) : (
          <div key={image.id} className="m-[5px]">
            <ImageComponent
              images={image}
              alt=""
              className="h-[150px] w-auto"
              lightboxImages={lightboxImages}
              lightboxShowTags
              size={300}
              loading="lazy"
            />
            <div className="text-center">
              {image.width} x {image.height}
            </div>
          </div>
        ),
      )}
    </div>
  );
};

const ImageChangeRow: FC<ImageChangeRowProps> = ({
  newImages,
  oldImages,
  showDiff = false,
}) =>
  (newImages ?? []).length > 0 || (oldImages ?? []).length > 0 ? (
    <div className={`ChangeRow ${CLASSNAME} grid grid-cols-12 gap-x-3`}>
      <b className="col-span-2 text-right">Images</b>
      {showDiff && (
        <div className="col-span-5">
          {(oldImages ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <Images images={oldImages} />
            </>
          )}
        </div>
      )}
      <div className={showDiff ? "col-span-5" : "col-span-10"}>
        {(newImages ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <Images images={newImages} />
          </>
        )}
      </div>
    </div>
  ) : null;

export default ImageChangeRow;
