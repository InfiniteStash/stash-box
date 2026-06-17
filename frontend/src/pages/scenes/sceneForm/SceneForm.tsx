import {
  faExclamationTriangle,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useLens } from "@hookform/lenses";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { renderSceneDetails } from "src/components/editCard/ModifyEdit";
import EditImages from "src/components/editImages";
import { EditNote, NavButtons, SubmitButtons } from "src/components/form";
import { GenderIcon, Icon } from "src/components/fragments";
import SearchField, {
  type PerformerResult,
  SearchType,
} from "src/components/searchField";
import StudioSelect from "src/components/studioSelect";
import TagSelect from "src/components/tagSelect";
import { Button, buttonVariants } from "src/components/ui/button";
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
import { Textarea } from "src/components/ui/textarea";
import URLInput from "src/components/urlInput";
import {
  type FingerprintAlgorithm,
  type GenderEnum,
  type ImageFragment,
  type SceneFragment as Scene,
  type SceneEditDetailsInput,
  ValidSiteTypeEnum,
} from "src/graphql";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
import { cn as cx } from "src/lib/utils";
import { formatDuration, parseDuration, performerHref } from "src/utils";
import DiffScene from "./diff";
import ExistingSceneAlert from "./ExistingSceneAlert";
import { type SceneFormData, SceneSchema } from "./schema";
import type { InitialScene } from "./types";

const CLASS_NAME = "SceneForm";

interface SceneProps {
  scene?: Scene | null;
  initial?: InitialScene;
  callback: (updateData: SceneEditDetailsInput, editNote: string) => void;
  saving: boolean;
  isCreate?: boolean;
  draftFingerprints?: {
    hash: string;
    algorithm: FingerprintAlgorithm;
    duration: number;
  }[];
}

const SceneForm: FC<SceneProps> = ({
  scene,
  initial,
  callback,
  saving,
  isCreate = false,
  draftFingerprints,
}) => {
  useBeforeUnload();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(SceneSchema),
    mode: "onBlur",
    defaultValues: {
      title: initial?.title ?? scene?.title ?? undefined,
      details: initial?.details ?? scene?.details ?? undefined,
      date: initial?.date ?? scene?.release_date ?? undefined,
      production_date:
        initial?.production_date ?? scene?.production_date ?? undefined,
      duration: formatDuration(initial?.duration ?? scene?.duration),
      director: initial?.director ?? scene?.director,
      code: initial?.code ?? scene?.code,
      urls: initial?.urls ?? scene?.urls ?? [],
      images: initial?.images ?? scene?.images ?? [],
      studio: initial?.studio ?? scene?.studio ?? undefined,
      tags: initial?.tags ?? scene?.tags ?? [],
      performers: (initial?.performers ?? scene?.performers ?? []).map((p) => ({
        performerId: p.performer.id,
        name: p.performer.name,
        alias: p.as ?? "",
        aliases: p.performer.aliases,
        gender: p.performer.gender,
        disambiguation: p.performer.disambiguation,
        deleted: p.performer.deleted,
      })),
    },
  });
  const {
    fields: performerFields,
    append: appendPerformer,
    remove: removePerformer,
    update: updatePerformer,
  } = useFieldArray({
    control,
    name: "performers",
    keyName: "key",
  });

  const lens = useLens({ control });

  const fieldData = watch();
  const [oldSceneChanges, newSceneChanges] = useMemo(
    () =>
      DiffScene(
        SceneSchema.cast(fieldData, {
          assert: "ignore-optionality",
        }) as SceneFormData,
        scene,
      ),
    [fieldData, scene],
  );

  const [isChanging, setChange] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState("details");
  const [file, setFile] = useState<File | undefined>();

  const onSubmit = (data: SceneFormData) => {
    const sceneData: SceneEditDetailsInput = {
      title: data.title,
      date: data.date,
      production_date: data.production_date,
      duration: parseDuration(data.duration),
      director: data.director,
      code: data.code,
      details: data.details,
      studio_id: data.studio?.id,
      performers: (data.performers ?? []).map((performance) => ({
        performer_id: performance.performerId,
        as: performance.alias,
      })),
      image_ids: data.images.map((i) => i.id),
      tag_ids: data.tags?.map((t) => t.id),
      urls: data.urls?.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
    };

    callback(sceneData, data.note);
  };

  const addPerformer = (result: PerformerResult) => {
    appendPerformer({
      name: result.name,
      performerId: result.id,
      gender: result.gender,
      alias: "",
      aliases: result.aliases,
      disambiguation: result.disambiguation ?? undefined,
      deleted: result.deleted,
    });
  };

  const handleRemove = (index: number) => {
    if (isChanging && isChanging > index) setChange(isChanging - 1);
    else if (isChanging === index) setChange(undefined);
    removePerformer(index);
  };

  const handleChange = (result: PerformerResult, index: number) => {
    setChange(undefined);
    const alias = performerFields[index].alias || performerFields[index].name;
    updatePerformer(index, {
      name: result.name,
      performerId: result.id,
      gender: result.gender,
      alias: alias === result.name ? "" : alias,
      aliases: result.aliases,
      disambiguation: result.disambiguation ?? undefined,
      deleted: result.deleted,
    });
  };

  const currentPerformerIds = performerFields.map((p) => p.performerId);

  const performerList = performerFields.map((p, index) => (
    <div
      className="performer-item flex flex-col gap-2 md:flex-row md:items-center"
      key={p.performerId}
    >
      <input
        type="hidden"
        defaultValue={p.performerId}
        {...register(`performers.${index}.performerId`)}
      />

      <div className="flex flex-1 items-center gap-1">
        <Button variant="danger" size="sm" onClick={() => handleRemove(index)}>
          Remove
        </Button>
        {isChanging === index ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setChange(undefined)}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setChange(index)}
          >
            Change
          </Button>
        )}
        {isChanging === index ? (
          <div className="flex-1">
            <SearchField
              autoFocus
              onClick={(res) =>
                res.__typename === "Performer" && handleChange(res, index)
              }
              excludeIDs={currentPerformerIds.filter(
                (id) => id !== p.performerId,
              )}
              searchType={SearchType.Performer}
              studioId={fieldData.studio?.parent?.id ?? fieldData.studio?.id}
            />
          </div>
        ) : (
          <>
            <span className="flex flex-1 items-center gap-1 truncate">
              <GenderIcon gender={p.gender as GenderEnum} />
              <span
                className={cx("truncate", {
                  "line-through": p.deleted,
                })}
              >
                <b>{p.name}</b>
                {p.disambiguation && (
                  <small className="ml-1">({p.disambiguation})</small>
                )}
              </span>
            </span>
            <a
              href={performerHref({ id: p.performerId })}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "primary", size: "sm" })}
            >
              <Icon icon={faExternalLinkAlt} />
            </a>
          </>
        )}
      </div>

      <div className="flex flex-1 items-center gap-2">
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          Scene Alias
        </span>
        <Controller
          name={`performers.${index}.alias`}
          control={control}
          render={({ field: { onChange } }) => (
            <>
              <Input
                id={`performers.${index}.alias`}
                list={`performers.${index}.alias-list`}
                defaultValue={p.alias ?? ""}
                onChange={(e) => onChange(e.currentTarget.value)}
                placeholder={p.name}
              />
              <datalist id={`performers.${index}.alias-list`}>
                {(p.aliases ?? []).map((alias) => (
                  <option key={alias} value={alias} />
                ))}
              </datalist>
            </>
          )}
        />
      </div>
    </div>
  ));

  const metadataErrors = [
    { error: errors.title?.message, tab: "details" },
    { error: errors.date?.message, tab: "details" },
    { error: errors.production_date?.message, tab: "details" },
    { error: errors.duration?.message, tab: "details" },
    {
      error: errors.studio !== undefined ? "Studio is required" : undefined,
      tab: "details",
    },
    {
      error: errors.urls?.find?.((u) => u?.url?.message)?.url?.message,
      tab: "links",
    },
  ].filter((e) => e.error) as { error: string; tab: string }[];

  return (
    <form className={CLASS_NAME} onSubmit={handleSubmit(onSubmit)}>
      {isCreate && (
        <div className="max-w-4xl">
          <ExistingSceneAlert
            title={fieldData.title}
            studio_id={fieldData.studio?.id}
            fingerprints={draftFingerprints}
          />
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="confirm">Confirm</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="max-w-4xl">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-12">
            <FormGroup className="md:col-span-8">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                aria-invalid={!!errors.title}
                placeholder="Title"
                {...register("title", { required: true })}
              />
              <FieldErrorMessage>{errors?.title?.message}</FieldErrorMessage>
            </FormGroup>

            <FormGroup className="md:col-span-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="text"
                aria-invalid={!!errors.date}
                placeholder="YYYY-MM-DD"
                {...register("date")}
              />
              <FieldErrorMessage>{errors?.date?.message}</FieldErrorMessage>
            </FormGroup>

            <FormGroup className="md:col-span-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                aria-invalid={!!errors.duration}
                placeholder="Duration"
                {...register("duration")}
              />
              <FieldErrorMessage>{errors?.duration?.message}</FieldErrorMessage>
            </FormGroup>
          </div>

          <FormGroup>
            <Label>Performers</Label>
            <div className="space-y-2">{performerList}</div>
            <div className="add-performer mt-2 flex items-center gap-2">
              <span className="whitespace-nowrap text-sm text-muted-foreground">
                Add performer:
              </span>
              <div className="flex-1">
                <SearchField
                  onClick={(res) =>
                    res.__typename === "Performer" && addPerformer(res)
                  }
                  excludeIDs={currentPerformerIds}
                  searchType={SearchType.Performer}
                  studioId={
                    fieldData.studio?.parent?.id ?? fieldData.studio?.id
                  }
                />
              </div>
            </div>
          </FormGroup>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormGroup className="studio-select">
              <Label htmlFor="scene-studio-select">Studio</Label>
              <Controller
                name="studio"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <StudioSelect
                    initialStudio={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    isClearable
                    inputId="scene-studio-select"
                  />
                )}
              />
              <FieldErrorMessage>
                {errors.studio !== undefined ? "Studio is required" : null}
              </FieldErrorMessage>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="code">Studio Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Unique code used by studio to identify scene"
                {...register("code")}
              />
            </FormGroup>
          </div>

          <FormGroup>
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              placeholder="Details"
              {...register("details")}
            />
          </FormGroup>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-12">
            <FormGroup className="md:col-span-4">
              <Label htmlFor="director">Director</Label>
              <Input
                id="director"
                type="text"
                placeholder="Director"
                {...register("director")}
              />
            </FormGroup>

            <FormGroup className="md:col-span-2">
              <Label htmlFor="production_date">Production Date</Label>
              <Input
                id="production_date"
                type="text"
                aria-invalid={!!errors.production_date}
                placeholder="YYYY-MM-DD"
                {...register("production_date")}
              />
              <FieldErrorMessage>
                {errors?.production_date?.message}
              </FieldErrorMessage>
            </FormGroup>
          </div>

          <FormGroup>
            <Label>Tags</Label>
            <Controller
              name="tags"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TagSelect tags={value} onChange={onChange} />
              )}
            />
          </FormGroup>

          <NavButtons onNext={() => setActiveTab("links")} />
        </TabsContent>

        <TabsContent value="links" className="max-w-4xl">
          <URLInput
            lens={lens.focus("urls").defined()}
            type={ValidSiteTypeEnum.SCENE}
            errors={errors.urls}
          />

          <NavButtons onNext={() => setActiveTab("images")} />
        </TabsContent>

        <TabsContent value="images">
          <EditImages
            lens={lens.focus("images").cast<ImageFragment[]>()}
            maxImages={1}
            file={file}
            setFile={(f) => setFile(f)}
            original={scene?.images}
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
          {renderSceneDetails(newSceneChanges, oldSceneChanges, !!scene)}
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

          <SubmitButtons disabled={saving} />
        </TabsContent>
      </Tabs>
    </form>
  );
};

export default SceneForm;
