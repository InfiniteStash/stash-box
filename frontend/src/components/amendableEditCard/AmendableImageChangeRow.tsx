import { faUndo, faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Icon } from "src/components/fragments";
import ImageComponent from "src/components/image";
import { Button } from "src/components/ui/button";
import { cn } from "src/lib/utils";
import { useAmendment } from "./AmendmentContext";

type Image = {
  height: number;
  id: string;
  url: string;
  width: number;
};

export interface AmendableImageChangeRowProps {
  field: string;
  newImages?: (Image | null)[] | null;
  oldImages?: (Image | null)[] | null;
  showDiff?: boolean;
}

const AmendableImageChangeRow: FC<AmendableImageChangeRowProps> = ({
  field,
  newImages,
  oldImages,
  showDiff = false,
}) => {
  const {
    state,
    clearAddedItem,
    clearRemovedItem,
    restoreAddedItem,
    restoreRemovedItem,
  } = useAmendment();

  const removedAddedIndices = state.removedAddedItems.get(field);
  const removedRemovedIndices = state.removedRemovedItems.get(field);

  const oldLightboxImages = (oldImages ?? []).filter((image) => image !== null);
  const newLightboxImages = (newImages ?? []).filter((image) => image !== null);

  if ((newImages ?? []).length === 0 && (oldImages ?? []).length === 0)
    return null;

  const renderImage = (
    image: Image | null,
    index: number,
    isRemoved: boolean | undefined,
    lightboxImages: Image[],
    onClear: () => void,
    onRestore: () => void,
  ) => (
    <div
      key={image?.id ?? `deleted-${index}`}
      className={cn("mb-2 flex items-start", isRemoved && "opacity-50")}
    >
      {image === null ? (
        <img className="m-[5px] h-[150px]" alt="Deleted" />
      ) : (
        <div className="m-[5px]">
          <ImageComponent
            images={image}
            alt=""
            size="full"
            className="h-[150px] w-auto"
            lightboxImages={lightboxImages}
          />
          <div className="text-center">
            {image.width} x {image.height}
          </div>
        </div>
      )}
      <div className="ml-2">
        {!isRemoved && (
          <Button
            variant="danger"
            size="sm"
            onClick={onClear}
            title="Remove this image change from the edit"
          >
            <Icon icon={faXmark} />
          </Button>
        )}
        {isRemoved && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRestore}
            title="Restore this image"
          >
            <Icon icon={faUndo} />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="ImageChangeRow grid grid-cols-12 gap-x-3">
      <b className="col-span-2 text-right">Images</b>
      {showDiff && (
        <div className="col-span-4">
          {(oldImages ?? []).length > 0 && (
            <>
              <h6>Removed</h6>
              <div className="flex flex-wrap">
                {(oldImages ?? []).map((image, index) =>
                  renderImage(
                    image,
                    index,
                    removedRemovedIndices?.has(index),
                    oldLightboxImages,
                    () => clearRemovedItem(field, index),
                    () => restoreRemovedItem(field, index),
                  ),
                )}
              </div>
            </>
          )}
        </div>
      )}
      <div className={showDiff ? "col-span-4" : "col-span-8"}>
        {(newImages ?? []).length > 0 && (
          <>
            {showDiff && <h6>Added</h6>}
            <div className="flex flex-wrap">
              {(newImages ?? []).map((image, index) =>
                renderImage(
                  image,
                  index,
                  removedAddedIndices?.has(index),
                  newLightboxImages,
                  () => clearAddedItem(field, index),
                  () => restoreAddedItem(field, index),
                ),
              )}
            </div>
          </>
        )}
      </div>
      <div className="col-span-2" />
    </div>
  );
};

export default AmendableImageChangeRow;
