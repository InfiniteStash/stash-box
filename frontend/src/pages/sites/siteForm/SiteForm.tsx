import { yupResolver } from "@hookform/resolvers/yup";
import { capitalize } from "lodash-es";
import type { FC } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { MultiCombobox, SelectCombobox } from "src/components/ui/combobox";
import {
  FieldError as FieldErrorMessage,
  FormGroup,
  Label,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Switch } from "src/components/ui/switch";
import {
  type SiteCreateInput,
  type SiteQuery,
  useSiteCategories,
  ValidSiteTypeEnum,
} from "src/graphql";
import * as yup from "yup";

type Site = NonNullable<SiteQuery["findSite"]>;

const validSites = Object.keys(ValidSiteTypeEnum);

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().optional(),
  url: yup.string().optional(),
  regex: yup.string().optional(),
  valid_types: yup
    .array(yup.string().oneOf(validSites).required())
    .min(1, "At least one site type is required")
    .ensure(),
  category_id: yup.number().nullable().optional(),
  highlighted: yup.boolean().default(true),
});

type SiteFormData = yup.Asserts<typeof schema>;

interface SiteProps {
  site?: Site;
  callback: (data: SiteCreateInput) => void;
}

const SiteForm: FC<SiteProps> = ({ site, callback }) => {
  const navigate = useNavigate();
  const { data: categoryData } = useSiteCategories();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const categories = (
    categoryData?.querySiteCategories.site_categories ?? []
  ).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const onSubmit = (data: SiteFormData) => {
    const callbackData: SiteCreateInput = {
      name: data.name,
      description: data.description,
      url: data.url,
      regex: data.regex,
      valid_types: data.valid_types as ValidSiteTypeEnum[],
      category_id: data.category_id ?? null,
      highlighted: data.highlighted,
    };
    callback(callbackData);
  };

  return (
    <form
      className="SiteForm w-full md:w-1/2"
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormGroup>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          aria-invalid={!!errors.name}
          placeholder="Name"
          defaultValue={site?.name ?? ""}
          {...register("name")}
        />
        <FieldErrorMessage>{errors?.name?.message}</FieldErrorMessage>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Description"
          defaultValue={site?.description ?? ""}
          {...register("description")}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          placeholder="URL"
          defaultValue={site?.url ?? ""}
          {...register("url")}
        />
        <p className="text-sm text-muted-foreground">
          URL of the site, if applicable.
        </p>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="regex">Regular Expression</Label>
        <Input
          id="regex"
          placeholder=""
          defaultValue={site?.regex ?? ""}
          {...register("regex")}
        />
        <p className="text-sm text-muted-foreground">
          An optional regular expression that will be used to clean links and
          autofill the Site selection with this Site. Must contain a capture
          group of the portion of the URL that will be kept.
          <br />
          Example:
          <br />
          This regexp{" "}
          <code>(https?:\/\/(?:www\.)?(?:(.*)\.)?example\.org\/?[^?#]+)</code>
          <br />
          will match this string{" "}
          <code>http://example.org/foo/bar?id=69#top</code>
          <br />
          and will clean it into <code>http://example.org/foo/bar</code>
        </p>
      </FormGroup>

      <FormGroup>
        <Label>Valid link targets</Label>
        <Controller
          control={control}
          name="valid_types"
          defaultValue={(site?.valid_types ?? []) as string[]}
          render={({ field: { onChange, value } }) => (
            <MultiCombobox
              values={value ?? []}
              onChange={onChange}
              options={validSites.map((s) => ({
                value: s,
                label: capitalize(s),
              }))}
              placeholder="Types this site can link to"
            />
          )}
        />
        <FieldErrorMessage>
          {(errors.valid_types as unknown as { message: string })?.message}
        </FieldErrorMessage>
      </FormGroup>

      <FormGroup>
        <Label>Category</Label>
        <Controller
          control={control}
          name="category_id"
          defaultValue={site?.category?.id ?? null}
          render={({ field: { onChange, value } }) => (
            <SelectCombobox
              value={value != null ? String(value) : undefined}
              isClearable
              onChange={(v) => onChange(v != null ? Number(v) : null)}
              options={categories.map((c) => ({
                value: String(c.value),
                label: c.label,
              }))}
              placeholder="Category the site belongs to"
            />
          )}
        />
        <p className="text-sm text-muted-foreground">
          Optional category used to group links. Uncategorized sites are shown
          under &ldquo;Other&rdquo;.
        </p>
      </FormGroup>

      <FormGroup>
        <Controller
          control={control}
          name="highlighted"
          defaultValue={site?.highlighted ?? true}
          render={({ field: { onChange, value } }) => (
            <Switch
              label="Highlight links"
              checked={value}
              onCheckedChange={onChange}
            />
          )}
        />
        <p className="text-sm text-muted-foreground">
          Highlighted sites are shown as icons on performer, scene, and studio
          pages. Other sites only appear in the links section.
        </p>
      </FormGroup>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit">Save</Button>
        <Button type="reset" className="sm:ml-auto">
          Reset
        </Button>
        <Button variant="danger" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default SiteForm;
