import { CombinedGraphQLErrors } from "@apollo/client";
import { faImages } from "@fortawesome/free-solid-svg-icons";
import type { Lens } from "@hookform/lenses";
import { type ChangeEvent, type FC, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { Image as ImageInput } from "src/components/form";
import { Icon, LoadingIndicator } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { type ImageFragment as Image, useAddImage } from "src/graphql";
import { cn } from "src/lib/utils";

const CLASSNAME = "EditImages";
const CLASSNAME_IMAGES = `${CLASSNAME}-images`;
const CLASSNAME_INPUT = `${CLASSNAME}-input`;
const CLASSNAME_INPUT_CONTAINER = `${CLASSNAME_INPUT}-container`;
const CLASSNAME_DROP = `${CLASSNAME}-drop`;
const CLASSNAME_PLACEHOLDER = `${CLASSNAME}-placeholder`;
const CLASSNAME_IMAGE = `${CLASSNAME}-image`;
const CLASSNAME_UPLOADING = `${CLASSNAME_IMAGE}-uploading`;

interface EditImagesProps {
  lens: Lens<Image[]>;
  file: File | undefined;
  setFile: (f: File | undefined) => void;
  maxImages?: number;
  /** Whether to allow svg/png image input */
  allowLossless?: boolean;
  original?: Image[] | undefined;
}

const EditImages: FC<EditImagesProps> = ({
  lens,
  maxImages,
  file,
  setFile,
  allowLossless = false,
  original,
}) => {
  const interop = lens.interop();
  const {
    fields: images,
    append,
    remove,
    replace,
  } = useFieldArray({
    control: interop.control,
    name: interop.name,
    keyName: "key",
  });

  const [imageData, setImageData] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [addImage] = useAddImage();
  const [error, setError] = useState<string>();

  const handleAddImage = () => {
    setError("");
    setUploading(true);
    addImage({
      variables: {
        imageData: { file },
      },
    })
      .then((i) => {
        if (i.data?.imageCreate?.id) {
          if (!images.some((image) => image.id === i.data?.imageCreate?.id)) {
            append(i.data.imageCreate);
          }
          setFile(undefined);
          setImageData("");
        }
      })
      .catch((error: unknown) => {
        if (CombinedGraphQLErrors.is(error)) setError(error.message);
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const removeImage = () => {
    setFile(undefined);
    setError("");
    setImageData("");
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      setFile(event.target.files[0]);

      const reader = new FileReader();
      reader.onload = (e) =>
        e.target?.result && setImageData(e.target.result as string);
      reader.onerror = () => setImageData("");
      reader.onabort = () => setImageData("");
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const isDisabled = maxImages !== undefined && images.length >= maxImages;

  return (
    <div className={`${CLASSNAME} grid w-full grid-cols-12`}>
      <div className={`${CLASSNAME_IMAGES} col-span-7`}>
        {images.map((i, index) => (
          <ImageInput
            image={i}
            lightboxImages={images}
            onRemove={() => remove(index)}
            key={i.id}
          />
        ))}
      </div>
      <div className={`${CLASSNAME_INPUT} col-span-5`}>
        <div className={CLASSNAME_INPUT_CONTAINER}>
          {file ? (
            <div
              className={cn(CLASSNAME_IMAGE, uploading && CLASSNAME_UPLOADING)}
            >
              <img src={imageData} alt="" />
              <LoadingIndicator message="Uploading image..." />
            </div>
          ) : (
            !isDisabled && (
              <div className={CLASSNAME_DROP}>
                <input
                  type="file"
                  onChange={onFileChange}
                  accept={[
                    ".jpg",
                    ".jpeg",
                    ".webp",
                    ".jfif",
                    ...(allowLossless ? [".svg", ".png"] : []),
                  ].join(",")}
                />
                <div className={CLASSNAME_PLACEHOLDER}>
                  <Icon icon={faImages} />
                  <span>Add image</span>
                </div>
              </div>
            )
          )}
        </div>
        <div className="text-right text-destructive">
          <div>{error}</div>
        </div>
        <div className="mt-4 flex">
          {file && (
            <>
              <Button
                variant="danger"
                onClick={() => removeImage()}
                disabled={!file || uploading}
              >
                Remove
              </Button>
              <Button
                onClick={() => handleAddImage()}
                disabled={!file || uploading}
                className="ml-2"
              >
                Upload
              </Button>
            </>
          )}
          <Button
            variant="danger"
            onClick={() => original && replace(original)}
            disabled={original === undefined}
            className="ml-auto mt-auto"
          >
            Reset Images
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditImages;
