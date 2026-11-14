import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
} from "react";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import ImageCategorizationFields from "src/components/image/ImageCategorizationFields";
import type { ImageCategorization } from "src/components/image/types";
import { Button } from "src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "src/components/ui/dialog";
import { Switch } from "src/components/ui/switch";
import {
  ImageTypeScopeEnum,
  useImageCategorization,
  useImageTypeGroups,
  useSetImageOrganized,
  useUpdateImage,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { errorMessage, maxImageDate, partialDateError } from "src/utils";

interface Props {
  imageId: string;
}

export interface CategorizationEditor {
  confirmLeave: (proceed: () => void) => void;
}

const ImageCategorizationEditor = forwardRef<CategorizationEditor, Props>(
  ({ imageId }, ref) => {
    const { isEditor, isModerator } = useCurrentUser();
    const controlId = useId();
    const [setOrganized, { loading: organizing }] = useSetImageOrganized();
    const { data, loading, error } = useImageCategorization({ id: imageId });
    const image = data?.findImage;
    const { data: vocabulary } = useImageTypeGroups({
      target: ImageTypeScopeEnum.PERFORMER,
      includeDisabled: true,
    });
    const [draft, setDraft] = useState<ImageCategorization | null>(null);
    const [saveError, setSaveError] = useState<string>();
    const [updateImage, { loading: saving }] = useUpdateImage();

    const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null);
    const dirty = Boolean(
      image &&
        draft &&
        isEditor &&
        !image.organized &&
        (draft.date !== image.date ||
          draft.types.length !== image.types.length ||
          draft.types.some((type) => !image.types.includes(type))),
    );

    useImperativeHandle(ref, () => ({
      confirmLeave: (proceed) => {
        if (saving) {
          return;
        }

        if (dirty) {
          setPendingLeave(() => proceed);
        } else {
          proceed();
        }
      },
    }));

    useEffect(() => {
      if (!dirty) {
        return;
      }
      const handler = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = "";
      };
      window.addEventListener("beforeunload", handler);
      return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    if (loading) {
      return <LoadingIndicator message="Loading categorization..." />;
    }

    if (error) {
      return <ErrorMessage error={errorMessage(error)} />;
    }

    if (!image) {
      return <ErrorMessage error="Image not found" />;
    }

    const value = draft ?? image;
    const dateError = partialDateError(value.date, maxImageDate());

    const commitState = async () => {
      if (!dirty) {
        return true;
      }

      if (dateError) {
        return false;
      }

      setSaveError(undefined);
      try {
        await updateImage({
          variables: {
            imageData: {
              id: imageId,
              types: value.types,
              date: value.date,
            },
          },
        });
        setDraft(null);
        return true;
      } catch (cause) {
        setSaveError(errorMessage(cause));
        return false;
      }
    };

    const toggleOrganized = async () => {
      setSaveError(undefined);

      if (!(await commitState())) {
        return;
      }

      try {
        await setOrganized({
          variables: {
            input: {
              id: imageId,
              organized: !image.organized,
            },
          },
        });
      } catch (cause) {
        setSaveError(errorMessage(cause));
      }
    };

    return (
      <div className="ImageCategorization">
        {isModerator && (
          <Switch
            className="ImageCategorization-organized-toggle"
            id={`${controlId}-organized`}
            label="Organized"
            checked={image.organized}
            disabled={saving || organizing || !!dateError}
            onCheckedChange={toggleOrganized}
          />
        )}
        <ImageCategorizationFields
          groups={vocabulary?.imageTypeGroups ?? []}
          value={value}
          onChange={setDraft}
          readOnly={!isEditor || image.organized}
        />
        {saveError && <p className="text-destructive">{saveError}</p>}
        {isEditor && !image.organized && (
          <Button
            onClick={commitState}
            disabled={!dirty || saving || !!dateError}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        )}
        <Dialog
          open={!!pendingLeave}
          onOpenChange={(open) => !open && setPendingLeave(null)}
        >
          <DialogContent>
            <DialogTitle>Discard categorization changes?</DialogTitle>
            <p>Your changes have not been saved.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPendingLeave(null)}>
                Keep editing
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const proceed = pendingLeave;
                  setPendingLeave(null);
                  proceed?.();
                }}
              >
                Discard changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  },
);

export default ImageCategorizationEditor;
