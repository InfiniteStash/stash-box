import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useLens } from "@hookform/lenses";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { renderStudioDetails } from "src/components/editCard/ModifyEdit";
import EditImages from "src/components/editImages";
import { EditNote, NavButtons, SubmitButtons } from "src/components/form";
import { Icon } from "src/components/fragments";
import MultiSelect from "src/components/multiSelect";
import StudioSelect from "src/components/studioSelect";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";
import URLInput from "src/components/urlInput";
import {
  type ImageFragment,
  type StudioFragment as Studio,
  type StudioEditDetailsInput,
  ValidSiteTypeEnum,
} from "src/graphql";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
import DiffStudio from "./diff";
import { type StudioFormData, StudioSchema } from "./schema";
import type { InitialStudio } from "./types";

interface StudioProps {
  studio?: Studio | null;
  callback: (data: StudioEditDetailsInput, editNote: string) => void;
  showNetworkSelect?: boolean;
  initial?: InitialStudio;
  saving: boolean;
}

const StudioForm: FC<StudioProps> = ({
  studio,
  callback,
  showNetworkSelect = true,
  initial,
  saving,
}) => {
  useBeforeUnload();
  const initialAliases = initial?.aliases ?? studio?.aliases ?? [];
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(StudioSchema),
    defaultValues: {
      name: initial?.name ?? studio?.name,
      aliases: initialAliases,
      images: initial?.images ?? studio?.images ?? [],
      urls: initial?.urls ?? studio?.urls ?? [],
      parent: initial?.parent ?? studio?.parent,
    },
  });

  const lens = useLens({ control });

  const [file, setFile] = useState<File | undefined>();
  const fieldData = watch();
  const [oldStudioChanges, newStudioChanges] = useMemo(
    () =>
      DiffStudio(
        StudioSchema.cast(fieldData, {
          assert: "ignore-optionality",
        }) as StudioFormData,
        studio,
      ),
    [fieldData, studio],
  );

  const [activeTab, setActiveTab] = useState("details");

  const onSubmit = (data: StudioFormData) => {
    const callbackData: StudioEditDetailsInput = {
      name: data.name,
      aliases: data.aliases ?? [],
      urls: data.urls?.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
      image_ids: data.images.map((i) => i.id),
      parent_id: data.parent?.id ?? null,
    };
    callback(callbackData, data.note);
  };

  const metadataErrors = [
    { error: errors.name?.message, tab: "details" },
    {
      error: errors.urls?.find?.((u) => u?.url?.message)?.url?.message,
      tab: "links",
    },
  ].filter((e) => e.error) as { error: string; tab: string }[];

  return (
    <form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="confirm">Confirm</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="max-w-2xl">
          <FormGroup>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              aria-invalid={!!errors.name}
              placeholder="Name"
              {...register("name")}
            />
            <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="studio-aliases-select">Aliases</Label>
            <Controller
              name="aliases"
              control={control}
              render={({ field: { onChange } }) => (
                <MultiSelect
                  initialValues={initialAliases}
                  onChange={onChange}
                  placeholder="Enter name..."
                  inputId="studio-aliases-select"
                />
              )}
            />
            <FieldErrorMessage>{errors?.aliases?.message}</FieldErrorMessage>
          </FormGroup>

          {showNetworkSelect && (
            <FormGroup>
              <Label htmlFor="studio-network-select">Network</Label>
              <Controller
                name="parent"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <StudioSelect
                    excludeStudio={studio?.id}
                    initialStudio={value}
                    onChange={onChange}
                    isClearable
                    networkSelect
                    inputId="studio-network-select"
                  />
                )}
              />
            </FormGroup>
          )}

          <NavButtons onNext={() => setActiveTab("links")} />
        </TabsContent>

        <TabsContent value="links" className="max-w-4xl">
          <FormGroup>
            <Label>Links</Label>
            <URLInput
              lens={lens.focus("urls").defined()}
              type={ValidSiteTypeEnum.STUDIO}
              errors={errors.urls}
            />
          </FormGroup>

          <NavButtons onNext={() => setActiveTab("images")} />
        </TabsContent>

        <TabsContent value="images" className="max-w-2xl">
          <EditImages
            lens={lens.focus("images").cast<ImageFragment[]>()}
            maxImages={1}
            file={file}
            setFile={(f) => setFile(f)}
            allowLossless
          />

          <NavButtons
            onNext={() => setActiveTab("confirm")}
            disabled={!!file}
          />

          {file && (
            <p className="mt-2 text-right text-sm text-destructive">
              Upload or remove image to continue.
            </p>
          )}
        </TabsContent>

        <TabsContent value="confirm" className="max-w-4xl">
          {renderStudioDetails(newStudioChanges, oldStudioChanges, !!studio)}
          <div className="my-4">
            <EditNote register={register} error={errors.note} />
          </div>

          {metadataErrors.length > 0 && (
            <div className="my-4 text-right">
              <h6 className="font-semibold">
                <Icon
                  icon={faExclamationTriangle}
                  className="text-destructive"
                />
                <span className="ml-1">Errors</span>
              </h6>
              <div className="flex flex-col text-destructive">
                {metadataErrors.map(({ error, tab }) => (
                  <Link to="#" key={error} onClick={() => setActiveTab(tab)}>
                    {error}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <SubmitButtons disabled={!!file || saving} />
        </TabsContent>
      </Tabs>
    </form>
  );
};

export default StudioForm;
