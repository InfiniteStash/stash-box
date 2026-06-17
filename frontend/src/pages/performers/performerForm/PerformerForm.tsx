import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useLens } from "@hookform/lenses";
import { yupResolver } from "@hookform/resolvers/yup";
import Countries from "i18n-iso-countries";
import english from "i18n-iso-countries/langs/en.json";
import { sortBy } from "lodash-es";
import { type FC, useEffect, useMemo, useState, type WheelEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { renderPerformerDetails } from "src/components/editCard/ModifyEdit";
import EditImages from "src/components/editImages";
import {
  BodyModification,
  EditNote,
  NavButtons,
  SubmitButtons,
} from "src/components/form";
import { Help, Icon } from "src/components/fragments";
import MergeConflicts from "src/components/mergeConflicts";
import MultiSelect from "src/components/multiSelect";
import { SelectCombobox } from "src/components/ui/combobox";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Select } from "src/components/ui/select";
import { Switch } from "src/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";
import URLInput from "src/components/urlInput";
import { GenderTypes } from "src/constants";
import {
  BreastTypeEnum,
  EthnicityEnum,
  EyeColorEnum,
  GenderEnum,
  HairColorEnum,
  type ImageFragment,
  type PerformerFragment as Performer,
  type PerformerEditDetailsInput,
  type PerformerEditOptionsInput,
  ValidSiteTypeEnum,
} from "src/graphql";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
import DiffPerformer from "./diff";
import ExistingPerformerAlert from "./ExistingPerformerAlert";
import type { PerformerMergeConflict } from "./merge";
import { type PerformerFormData, PerformerSchema } from "./schema";
import type { InitialPerformer } from "./types";

Countries.registerLocale(english);
const CountryList = Countries.getNames("en", { select: "alias" });

type OptionEnum = {
  value: string;
  label: string;
  disabled?: boolean;
};

const genderOptions = Object.keys(GenderEnum).map((g) => ({
  value: g,
  label: GenderTypes[g as GenderEnum],
}));

const GENDER: OptionEnum[] = [
  { value: "", label: "Select gender...", disabled: true },
  { value: "null", label: "Unknown" },
  ...genderOptions,
];

const HAIR: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "BLONDE", label: "Blond" },
  { value: "BRUNETTE", label: "Brown" },
  { value: "BLACK", label: "Black" },
  { value: "RED", label: "Red" },
  { value: "AUBURN", label: "Auburn" },
  { value: "GREY", label: "Grey" },
  { value: "WHITE", label: "White" },
  { value: "BALD", label: "Bald" },
  { value: "VARIOUS", label: "Various" },
  { value: "OTHER", label: "Other" },
];

const BREAST: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "NATURAL", label: "Natural" },
  { value: "FAKE", label: "Augmented" },
  { value: "NA", label: "N/A" },
];

const EYE: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "BLUE", label: "Blue" },
  { value: "BROWN", label: "Brown" },
  { value: "GREY", label: "Grey" },
  { value: "GREEN", label: "Green" },
  { value: "HAZEL", label: "Hazel" },
  { value: "RED", label: "Red" },
];

const ETHNICITY: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "CAUCASIAN", label: "Caucasian" },
  { value: "BLACK", label: "Black" },
  { value: "ASIAN", label: "Asian" },
  { value: "INDIAN", label: "Indian" },
  { value: "LATIN", label: "Latin" },
  { value: "MIDDLE_EASTERN", label: "Middle Eastern" },
  { value: "MIXED", label: "Mixed" },
  { value: "OTHER", label: "Other" },
];

const UPDATE_ALIAS_MESSAGE = `Enabling this option sets the current name as an alias on every scene that this performer does not have an alias on.
In most cases, it should be enabled when renaming a performer to a different alias, and disabled when correcting a typo in the name.
`;

const getEnumValue = (enumArray: OptionEnum[], val: string | null) => {
  if (val === null) return enumArray[0].value;

  return val;
};

interface PerformerProps {
  performer?: Performer | null;
  callback: (
    data: PerformerEditDetailsInput,
    note: string,
    updateAliases: boolean,
    id?: string,
  ) => void;
  initial?: InitialPerformer;
  conflicts?: PerformerMergeConflict[];
  options?: PerformerEditOptionsInput | null;
  saving: boolean;
  isCreate?: boolean;
}

const PerformerForm: FC<PerformerProps> = ({
  performer,
  callback,
  initial,
  conflicts,
  saving,
  options,
  isCreate = false,
}) => {
  useBeforeUnload();
  const initialAliases = initial?.aliases ?? performer?.aliases ?? [];
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(PerformerSchema),
    mode: "onBlur",
    defaultValues: {
      name: initial?.name ?? performer?.name ?? "",
      disambiguation: initial?.disambiguation ?? performer?.disambiguation,
      aliases: initialAliases,
      gender: initial?.gender ?? performer?.gender ?? "",
      birthdate: initial?.birthdate ?? performer?.birth_date ?? undefined,
      deathdate: initial?.deathdate ?? performer?.death_date ?? undefined,
      eye_color: getEnumValue(
        EYE,
        initial?.eye_color ?? performer?.eye_color ?? null,
      ),
      hair_color: getEnumValue(
        HAIR,
        initial?.hair_color ?? performer?.hair_color ?? null,
      ),
      height: initial?.height || performer?.height,
      breastType: getEnumValue(
        BREAST,
        initial?.breast_type ?? performer?.breast_type ?? null,
      ),
      bandSize: initial?.band_size ?? performer?.band_size,
      cupSize: initial?.cup_size ?? performer?.cup_size,
      waistSize: initial?.waist_size ?? performer?.waist_size,
      hipSize: initial?.hip_size ?? performer?.hip_size,
      country: initial?.country ?? performer?.country ?? "",
      ethnicity: getEnumValue(
        ETHNICITY,
        initial?.ethnicity ?? performer?.ethnicity ?? null,
      ),
      career_start_year:
        initial?.career_start_year ?? performer?.career_start_year,
      career_end_year: initial?.career_end_year ?? performer?.career_end_year,
      tattoos: initial?.tattoos ?? performer?.tattoos ?? [],
      piercings: initial?.piercings ?? performer?.piercings ?? [],
      images: initial?.images ?? performer?.images ?? [],
      urls: initial?.urls ?? performer?.urls ?? [],
    },
  });

  const lens = useLens({ control });

  const [activeTab, setActiveTab] = useState("personal");
  const [updateAliases, setUpdateAliases] = useState<boolean>(
    options?.set_modify_aliases ?? true,
  );
  const [file, setFile] = useState<File | undefined>();

  const fieldData = watch();
  const [oldChanges, newChanges] = useMemo(
    () =>
      DiffPerformer(
        PerformerSchema.cast(fieldData, {
          assert: "ignore-optionality",
        }) as PerformerFormData,
        performer,
      ),
    [fieldData, performer],
  );

  const changedName =
    !!performer?.id &&
    newChanges.name !== null &&
    performer?.name?.trim() !== newChanges.name;

  const showBreastType =
    fieldData.gender !== GenderEnum.MALE &&
    fieldData.gender !== GenderEnum.TRANSGENDER_MALE;
  // Update breast type based on gender
  useEffect(() => {
    if (!showBreastType) setValue("breastType", BreastTypeEnum.NA);
  }, [showBreastType, setValue]);

  const enumOptions = (enums: OptionEnum[]) =>
    enums.map((obj) => (
      <option key={obj.value} value={obj.value} disabled={!!obj.disabled}>
        {obj.label}
      </option>
    ));

  const onSubmit = (data: PerformerFormData) => {
    const performerData: PerformerEditDetailsInput = {
      name: data.name,
      disambiguation: data.disambiguation,
      gender: GenderEnum[data.gender as keyof typeof GenderEnum] || null,
      birthdate: data.birthdate,
      deathdate: data.deathdate,
      eye_color:
        EyeColorEnum[data.eye_color as keyof typeof EyeColorEnum] || null,
      hair_color:
        HairColorEnum[data.hair_color as keyof typeof HairColorEnum] || null,
      career_start_year: data.career_start_year,
      career_end_year: data.career_end_year,
      height: data.height,
      waist_size: data.waistSize,
      hip_size: data.hipSize,
      ethnicity:
        EthnicityEnum[data.ethnicity as keyof typeof EthnicityEnum] || null,
      country: data.country,
      aliases: data.aliases,
      piercings: data.piercings ?? [],
      tattoos: data.tattoos ?? [],
      breast_type:
        BreastTypeEnum[data.breastType as keyof typeof BreastTypeEnum] || null,
      image_ids: data.images.map((i) => i.id),
      urls: data.urls?.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
    };

    performerData.cup_size = data.cupSize?.toUpperCase() ?? null;
    performerData.band_size = data.bandSize ?? null;

    if (
      data.gender === GenderEnum.MALE ||
      data.gender === GenderEnum.TRANSGENDER_MALE
    )
      performerData.breast_type = BreastTypeEnum.NA;

    callback(performerData, data.note, updateAliases, data.id);
  };

  const countryObj = [
    { label: "Unknown", value: "" },
    ...sortBy(
      Object.entries(CountryList).map(([, countryName]) => {
        return {
          label: countryName,
          value: Countries.getAlpha2Code(countryName, "en"),
        };
      }),
      "label",
    ),
  ];

  const handleNumberInputWheel = (el: WheelEvent<HTMLInputElement>) =>
    el.currentTarget.blur();

  const metadataErrors = [
    { error: errors.name?.message, tab: "personal" },
    { error: errors.gender?.message, tab: "personal" },
    { error: errors.birthdate?.message, tab: "personal" },
    { error: errors.deathdate?.message, tab: "personal" },
    { error: errors.career_start_year?.message, tab: "personal" },
    { error: errors.career_end_year?.message, tab: "personal" },
    { error: errors.height?.message, tab: "personal" },
    { error: errors.bandSize?.message, tab: "personal" },
    { error: errors.cupSize?.message, tab: "personal" },
    { error: errors.waistSize?.message, tab: "personal" },
    {
      error: errors.urls?.find?.((u) => u?.url?.message)?.url?.message,
      tab: "links",
    },
  ].filter((e) => e.error) as { error: string; tab: string }[];

  return (
    <form className="PerformerForm" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" value={performer?.id} {...register("id")} />
      {conflicts && conflicts.length > 0 && (
        <div className="max-w-4xl">
          <MergeConflicts
            conflicts={conflicts}
            values={fieldData}
            onSelect={(field, value) =>
              // RHF cannot infer the value type from a dynamic field name.
              setValue(field, value as never, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      )}
      {isCreate && (
        <div className="max-w-4xl">
          <ExistingPerformerAlert
            name={fieldData.name || ""}
            disambiguation={fieldData.disambiguation}
            urls={fieldData.urls || []}
          />
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="bodymod">Tattoos and Piercings</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="confirm">Confirm</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="max-w-4xl">
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormGroup>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
              <p className="text-sm text-muted-foreground">
                The primary name used by the performer.
              </p>
            </FormGroup>
            <FormGroup>
              <Label htmlFor="disambiguation">Disambiguation</Label>
              <Input
                id="disambiguation"
                aria-invalid={!!errors.disambiguation}
                {...register("disambiguation")}
              />
              <p className="text-sm text-muted-foreground">
                Required if the primary name is not unique.
              </p>
            </FormGroup>
          </div>

          {changedName && (
            <FormGroup>
              <div className="flex items-center gap-2">
                <Switch
                  id="update-modify-aliases"
                  checked={updateAliases}
                  onCheckedChange={() => setUpdateAliases((prev) => !prev)}
                  label="Set unset performance aliases to old name"
                />
                <Help message={UPDATE_ALIAS_MESSAGE} />
              </div>
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="performer-aliases-select">Aliases</Label>
            <Controller
              control={control}
              name="aliases"
              render={({ field: { onChange } }) => (
                <MultiSelect
                  initialValues={initialAliases}
                  onChange={onChange}
                  placeholder="Enter name..."
                  inputId="performer-aliases-select"
                />
              )}
            />
            <p className="text-sm text-muted-foreground">
              Any names used by the performer different from the primary name.
            </p>
          </FormGroup>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-12">
            <FormGroup className="md:col-span-6">
              <Label htmlFor="gender">Gender</Label>
              <Select
                id="gender"
                aria-invalid={!!errors.gender}
                {...register("gender")}
              >
                {enumOptions(GENDER)}
              </Select>
              <FieldErrorMessage>{errors?.gender?.message}</FieldErrorMessage>
            </FormGroup>

            <FormGroup className="md:col-span-3">
              <Label htmlFor="birthdate">Birthdate</Label>
              <Input
                id="birthdate"
                aria-invalid={!!errors.birthdate}
                placeholder="YYYY-MM-DD"
                {...register("birthdate")}
              />
              <FieldErrorMessage>
                {errors?.birthdate?.message}
              </FieldErrorMessage>
            </FormGroup>

            <FormGroup className="md:col-span-3">
              <Label htmlFor="deathdate">Deathdate</Label>
              <Input
                id="deathdate"
                aria-invalid={!!errors.deathdate}
                placeholder="YYYY-MM-DD"
                {...register("deathdate")}
              />
              <FieldErrorMessage>
                {errors?.deathdate?.message}
              </FieldErrorMessage>
            </FormGroup>
          </div>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            If the precise date is unknown the day and/or month can be omitted.
          </p>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormGroup>
              <Label htmlFor="eye_color">Eye Color</Label>
              <Select
                id="eye_color"
                aria-invalid={!!errors.eye_color}
                {...register("eye_color")}
              >
                {enumOptions(EYE)}
              </Select>
              <FieldErrorMessage>
                {errors?.eye_color?.message}
              </FieldErrorMessage>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="hair_color">Hair Color</Label>
              <Select
                id="hair_color"
                aria-invalid={!!errors.hair_color}
                {...register("hair_color")}
              >
                {enumOptions(HAIR)}
              </Select>
              <FieldErrorMessage>
                {errors?.hair_color?.message}
              </FieldErrorMessage>
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormGroup>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                aria-invalid={!!errors.height}
                type="number"
                onWheel={handleNumberInputWheel}
                {...register("height")}
              />
              <FieldErrorMessage>{errors?.height?.message}</FieldErrorMessage>
              <p className="text-sm text-muted-foreground">
                Height in centimeters
              </p>
            </FormGroup>

            {fieldData.gender !== "MALE" &&
              fieldData.gender !== "TRANSGENDER_MALE" && (
                <FormGroup>
                  <Label htmlFor="breastType">Breast type</Label>
                  <Select
                    id="breastType"
                    aria-invalid={!!errors.breastType}
                    {...register("breastType")}
                  >
                    {enumOptions(BREAST)}
                  </Select>
                  <FieldErrorMessage>
                    {errors?.breastType?.message}
                  </FieldErrorMessage>
                </FormGroup>
              )}
          </div>

          {showBreastType && (
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-12">
              <FormGroup className="md:col-span-2">
                <Label htmlFor="bandSize">Band size</Label>
                <Input
                  id="bandSize"
                  aria-invalid={!!errors.bandSize}
                  type="number"
                  onWheel={handleNumberInputWheel}
                  {...register("bandSize")}
                />
                <FieldErrorMessage>
                  {errors?.bandSize?.message}
                </FieldErrorMessage>
                <p className="text-sm text-muted-foreground">
                  US Bra size number
                </p>
              </FormGroup>

              <FormGroup className="md:col-span-2">
                <Label htmlFor="cupSize">Cup size</Label>
                <Input
                  id="cupSize"
                  aria-invalid={!!errors.cupSize}
                  {...register("cupSize")}
                />
                <FieldErrorMessage>
                  {errors?.cupSize?.message}
                </FieldErrorMessage>
                <p className="text-sm text-muted-foreground">
                  US Bra size letter(s)
                </p>
              </FormGroup>

              <FormGroup className="md:col-span-4">
                <Label htmlFor="waistSize">Waist size</Label>
                <Input
                  id="waistSize"
                  aria-invalid={!!errors.waistSize}
                  type="number"
                  onWheel={handleNumberInputWheel}
                  {...register("waistSize")}
                />
                <FieldErrorMessage>
                  {errors?.waistSize?.message}
                </FieldErrorMessage>
                <p className="text-sm text-muted-foreground">
                  Waist circumference in inches
                </p>
              </FormGroup>

              <FormGroup className="md:col-span-4">
                <Label htmlFor="hipSize">Hip size</Label>
                <Input
                  id="hipSize"
                  aria-invalid={!!errors.hipSize}
                  type="number"
                  onWheel={handleNumberInputWheel}
                  {...register("hipSize")}
                />
                <FieldErrorMessage>
                  {errors?.hipSize?.message}
                </FieldErrorMessage>
                <p className="text-sm text-muted-foreground">
                  Hip circumference in inches
                </p>
              </FormGroup>
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormGroup>
              <Label htmlFor="country">Nationality</Label>
              <Controller
                control={control}
                name="country"
                render={({ field: { onChange, value } }) => (
                  <SelectCombobox
                    inputId="country"
                    onChange={(v) => onChange(v)}
                    options={countryObj.filter(
                      (c): c is { label: string; value: string } =>
                        c.value != null,
                    )}
                    value={value ?? undefined}
                  />
                )}
              />
              <FieldErrorMessage>{errors?.country?.message}</FieldErrorMessage>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="ethnicity">Ethnicity</Label>
              <Select
                id="ethnicity"
                aria-invalid={!!errors.ethnicity}
                {...register("ethnicity")}
              >
                {enumOptions(ETHNICITY)}
              </Select>
              <FieldErrorMessage>
                {errors?.ethnicity?.message}
              </FieldErrorMessage>
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <FormGroup>
              <Label htmlFor="career_start_year">Career Start</Label>
              <Input
                id="career_start_year"
                aria-invalid={!!errors.career_start_year}
                type="year"
                placeholder="Year"
                {...register("career_start_year")}
              />
              <FieldErrorMessage>
                {errors?.career_start_year?.message}
              </FieldErrorMessage>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="career_end_year">Career End</Label>
              <Input
                id="career_end_year"
                aria-invalid={!!errors.career_end_year}
                type="year"
                placeholder="Year"
                {...register("career_end_year")}
              />
              <FieldErrorMessage>
                {errors?.career_end_year?.message}
              </FieldErrorMessage>
            </FormGroup>
          </div>

          <NavButtons onNext={() => setActiveTab("bodymod")} />
        </TabsContent>

        <TabsContent value="bodymod" className="max-w-4xl">
          <BodyModification
            lens={lens.focus("tattoos").defined().cast()}
            name="tattoos"
            locationPlaceholder="Add a tattoo for a location..."
            descriptionPlaceholder="Tattoo description..."
            formatLabel={(text) => `Add tattoo for location "${text}"`}
          />
          {errors?.tattoos && (
            <div className="text-sm text-destructive">
              {errors.tattoos.map?.((mod, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Undefined location
                <div key={idx}>
                  Tattoo {idx + 1}: {mod?.location?.message}
                </div>
              ))}
            </div>
          )}

          <BodyModification
            lens={lens.focus("piercings").defined().cast()}
            name="piercings"
            locationPlaceholder="Add a piercing for a location..."
            descriptionPlaceholder="Piercing description..."
            formatLabel={(text) => `Add piercing for location "${text}"`}
          />
          {errors?.piercings && (
            <div className="text-sm text-destructive">
              {errors.piercings.map?.((mod, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: Undefined location
                <div key={idx}>
                  Piercing {idx + 1}: {mod?.location?.message}
                </div>
              ))}
            </div>
          )}

          <NavButtons onNext={() => setActiveTab("links")} />
        </TabsContent>

        <TabsContent value="links" className="max-w-4xl">
          <URLInput
            lens={lens.focus("urls").defined()}
            type={ValidSiteTypeEnum.PERFORMER}
            errors={errors.urls}
          />

          <NavButtons onNext={() => setActiveTab("images")} />
        </TabsContent>

        <TabsContent value="images">
          <EditImages
            lens={lens.focus("images").cast<ImageFragment[]>()}
            file={file}
            setFile={(f) => setFile(f)}
            original={performer?.images}
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
          {renderPerformerDetails(
            newChanges,
            oldChanges,
            !!performer,
            updateAliases,
          )}
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

export default PerformerForm;
