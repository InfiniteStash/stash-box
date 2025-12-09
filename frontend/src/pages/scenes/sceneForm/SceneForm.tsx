import {
  faArrowRightArrowLeft,
  faExclamationTriangle,
  faExternalLinkAlt,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useLens } from "@hookform/lenses";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { type FC, useMemo, useState } from "react";
import { Button, Col, Form, InputGroup, Row, Tab, Tabs } from "react-bootstrap";
import { Menu, MenuItem, Typeahead } from "react-bootstrap-typeahead";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import Select from "react-select";
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
import URLInput from "src/components/urlInput";
import {
  type FingerprintAlgorithm,
  type GenderEnum,
  type ImageFragment,
  type SceneFragment as Scene,
  type SceneEditDetailsInput,
  ValidSiteTypeEnum,
} from "src/graphql";
import { useGetCreditRoles } from "src/graphql/queries";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
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
  const { data: creditRolesData } = useGetCreditRoles();
  const creditRoles = creditRolesData?.getCreditRoles ?? [];

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
      code: initial?.code ?? scene?.code,
      urls: initial?.urls ?? scene?.urls ?? [],
      images: initial?.images ?? scene?.images ?? [],
      studio: initial?.studio ?? scene?.studio ?? undefined,
      tags: initial?.tags ?? scene?.tags ?? [],
      credits: (initial?.credits ?? scene?.credits ?? []).map((c) => ({
        performerId: c.performer.id,
        name: c.performer.name,
        creditRoleId: c.credit_role.id,
        creditRoleName: c.credit_role.name,
        alias: c.as ?? "",
        tags: c.tags ?? [],
        aliases: c.performer.aliases,
        gender: c.performer.gender,
        disambiguation: c.performer.disambiguation,
        deleted: c.performer.deleted,
      })),
    },
  });
  const {
    fields: creditFields,
    append: appendCredit,
    remove: removeCredit,
    update: updateCredit,
  } = useFieldArray({
    control,
    name: "credits",
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
      code: data.code,
      details: data.details,
      studio_id: data.studio?.id,
      credits: data.credits?.map((c) => ({
        performer_id: c.performerId,
        credit_role_id: c.creditRoleId,
        as: c.alias || null,
        tag_ids: c.tags?.map((t) => t.id) ?? [],
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

  const addCredit = (result: PerformerResult) => {
    appendCredit({
      name: result.name,
      performerId: result.id,
      gender: result.gender,
      creditRoleId: 1, // Default to PERFORMANCE
      creditRoleName: "PERFORMANCE",
      alias: "",
      tags: [],
      aliases: result.aliases,
      disambiguation: result.disambiguation ?? undefined,
      deleted: result.deleted,
    });
  };

  const handleRemove = (index: number) => {
    if (isChanging && isChanging > index) setChange(isChanging - 1);
    else if (isChanging === index) setChange(undefined);
    removeCredit(index);
  };

  const handleChange = (result: PerformerResult, index: number) => {
    setChange(undefined);
    const currentCredit = creditFields[index];
    const alias = currentCredit.alias || currentCredit.name;
    updateCredit(index, {
      name: result.name,
      performerId: result.id,
      gender: result.gender,
      creditRoleId: currentCredit.creditRoleId,
      creditRoleName: currentCredit.creditRoleName,
      alias: alias === result.name ? "" : alias,
      tags: currentCredit.tags,
      aliases: result.aliases,
      disambiguation: result.disambiguation ?? undefined,
      deleted: result.deleted,
    });
  };

  const currentPerformerIds = creditFields.map((c) => c.performerId);

  const creditList = creditFields.map((c, index) => {
    const currentRole = creditRoles.find(
      (r: { id: number }) => r.id === c.creditRoleId,
    );
    const roleOptions = creditRoles.map(
      (role: { id: number; name: string }) => ({
        value: role.id,
        label: role.name,
      }),
    );
    const tagOptions =
      currentRole?.valid_tags.map((tag: { id: string; name: string }) => ({
        value: tag.id,
        label: tag.name,
      })) ?? [];

    return (
      <div>
        <Row key={c.key}>
          <Form.Control
            type="hidden"
            defaultValue={c.performerId}
            {...register(`credits.${index}.performerId`)}
          />
          <Form.Control
            type="hidden"
            defaultValue={c.creditRoleId}
            {...register(`credits.${index}.creditRoleId`)}
          />
          <Form.Control
            type="hidden"
            defaultValue={c.creditRoleName}
            {...register(`credits.${index}.creditRoleName`)}
          />

          <Col xs={6} className="mb-2">
            <InputGroup>
              <Button
                variant="danger"
                onClick={() => handleRemove(index)}
                title="Remove"
              >
                <Icon icon={faTrash} />
              </Button>
              {isChanging === index ? (
                <Button
                  variant="primary"
                  onClick={() => setChange(undefined)}
                  title="Cancel"
                >
                  <Icon icon={faXmark} />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setChange(index)}
                  title="Change"
                >
                  <Icon icon={faArrowRightArrowLeft} />
                </Button>
              )}
              {isChanging === index ? (
                <SearchField
                  autoFocus
                  onClick={(res) =>
                    res.__typename === "Performer" && handleChange(res, index)
                  }
                  excludeIDs={currentPerformerIds.filter(
                    (id) => id !== c.performerId,
                  )}
                  searchType={SearchType.Performer}
                />
              ) : (
                <>
                  <InputGroup.Text className="flex-grow-1 text-start text-truncate">
                    <GenderIcon gender={c.gender as GenderEnum} />
                    <span
                      className={cx("performer-name text-truncate", {
                        "text-decoration-line-through": c.deleted,
                      })}
                    >
                      <b>{c.name}</b>
                      {c.disambiguation && (
                        <small className="ms-1">({c.disambiguation})</small>
                      )}
                    </span>
                  </InputGroup.Text>
                  <Button
                    variant="primary"
                    href={performerHref({ id: c.performerId })}
                    target="_blank"
                  >
                    <Icon icon={faExternalLinkAlt} />
                  </Button>
                </>
              )}
            </InputGroup>
          </Col>

          <Col xs={6} className="mb-2">
            <InputGroup>
              <InputGroup.Text>Alias</InputGroup.Text>
              <Controller
                name={`credits.${index}.alias`}
                control={control}
                render={({ field: { onChange } }) => (
                  <Typeahead
                    id={`credits.${index}.alias`}
                    onInputChange={onChange}
                    onChange={(selected) =>
                      selected.length && onChange(selected[0])
                    }
                    options={c.aliases ?? []}
                    defaultInputValue={c.alias ?? ""}
                    emptyLabel={""}
                    disabled={isChanging === index}
                    renderMenu={(options, { id }) => {
                      if (!options.length) {
                        // biome-ignore lint/complexity/noUselessFragments: Necessary for return type
                        return <></>;
                      }
                      const results = options as string[];
                      return (
                        <Menu id={id}>
                          <MenuItem
                            option="aliases"
                            position={0}
                            key={"header"}
                            disabled
                          >
                            <b className="text-dark">{`${c.name}'s Aliases`}</b>
                          </MenuItem>
                          {results.map((result, idx) => (
                            <MenuItem
                              option={result}
                              position={idx + 1}
                              key={result}
                            >
                              {result}
                            </MenuItem>
                          ))}
                        </Menu>
                      );
                    }}
                    placeholder={c.name}
                  />
                )}
              />
            </InputGroup>
          </Col>
        </Row>

        <Row>
          <Col xs={3} className="mb-2">
            <Controller
              name={`credits.${index}.creditRoleId`}
              control={control}
              render={({ field: { onChange, value } }) => (
                <Select
                  classNamePrefix="react-select"
                  options={roleOptions}
                  value={roleOptions.find(
                    (opt: { value: number }) => opt.value === value,
                  )}
                  onChange={(selected) => {
                    if (selected) {
                      onChange(selected.value);
                      const role = creditRoles.find(
                        (r: { id: number }) => r.id === selected.value,
                      );
                      if (role) {
                        // Update role name and clear tags when role changes
                        updateCredit(index, {
                          ...creditFields[index],
                          creditRoleId: selected.value,
                          creditRoleName: role.name,
                          tags: [],
                        });
                      }
                    }
                  }}
                  isDisabled={isChanging === index}
                  styles={{
                    control: (baseStyles) => ({
                      ...baseStyles,
                      fontWeight: "bold",
                    }),
                  }}
                />
              )}
            />
          </Col>

          <Col xs={{ span: 6, offset: 3 }}>
            <InputGroup>
              <InputGroup.Text>Tags</InputGroup.Text>
              <Controller
                name={`credits.${index}.tags`}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNamePrefix="react-select"
                    className="flex-grow-1"
                    options={tagOptions}
                    value={tagOptions.filter((opt: { value: string }) =>
                      value?.some((t: { id: string }) => t.id === opt.value),
                    )}
                    onChange={(selected) => {
                      const selectedTags = selected.map(
                        (s: { value: string; label: string }) => {
                          const tag = currentRole?.valid_tags.find(
                            (t: { id: string }) => t.id === s.value,
                          );
                          return {
                            id: s.value,
                            name: s.label,
                            description: tag?.description ?? null,
                          };
                        },
                      );
                      onChange(selectedTags);
                    }}
                    isMulti
                    isDisabled={isChanging === index || tagOptions.length === 0}
                    placeholder={
                      tagOptions.length === 0
                        ? "No tags available for this role"
                        : "Select tags..."
                    }
                  />
                )}
              />
            </InputGroup>
          </Col>
        </Row>
      </div>
    );
  });

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
    <Form className={CLASS_NAME} onSubmit={handleSubmit(onSubmit)}>
      {isCreate && (
        <Row>
          <Col xs={9}>
            <ExistingSceneAlert
              title={fieldData.title}
              studio_id={fieldData.studio?.id}
              fingerprints={draftFingerprints}
            />
          </Col>
        </Row>
      )}
      <Tabs activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
        <Tab eventKey="details" title="Details" className="col-xl-9">
          <Row>
            <Form.Group controlId="title" className="col-8 mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.title })}
                type="text"
                placeholder="Title"
                {...register("title", { required: true })}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="date" className="col-2 mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.date })}
                type="text"
                placeholder="YYYY-MM-DD"
                {...register("date")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.date?.message}
              </Form.Control.Feedback>
              {/* <Form.Text>
                If the precise date is unknown the day and/or month can be
                omitted.
              </Form.Text> */}
            </Form.Group>

            <Form.Group controlId="duration" className="col-2 mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.duration })}
                placeholder="Duration"
                {...register("duration")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.duration?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group className="col mb-3">
              <Form.Label>Credits</Form.Label>
              <div className="SceneForm-credit-list">{creditList}</div>
              <div className="add-performer">
                <span>Add credit:</span>
                <SearchField
                  onClick={(res) =>
                    res.__typename === "Performer" && addCredit(res)
                  }
                  excludeIDs={currentPerformerIds}
                  searchType={SearchType.Performer}
                  studioId={
                    fieldData.studio?.parent?.id ?? fieldData.studio?.id
                  }
                />
              </div>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group
              controlId="studioId"
              className="studio-select col-6 mb-3"
            >
              <Form.Label htmlFor="scene-studio-select">Studio</Form.Label>
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
              <Form.Control.Feedback type="invalid">
                {errors.studio !== undefined ? "Studio is required" : null}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="code" className="col-6 mb-3">
              <Form.Label>Studio Code</Form.Label>
              <Form.Control
                as="input"
                type="text"
                placeholder="Unique code used by studio to identify scene"
                {...register("code")}
              />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="details" className="col mb-3">
              <Form.Label>Details</Form.Label>
              <Form.Control
                as="textarea"
                className="description"
                placeholder="Details"
                {...register("details")}
              />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="production_date" className="col-6 mb-3">
              <Form.Label>Production Date</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.production_date })}
                type="text"
                placeholder="YYYY-MM-DD"
                {...register("production_date")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.production_date?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="col-6 mb-3" />
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Tags</Form.Label>
            <Controller
              name="tags"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TagSelect
                  tags={value}
                  onChange={onChange}
                  menuPlacement="top"
                />
              )}
            />
          </Form.Group>

          <NavButtons onNext={() => setActiveTab("links")} />
        </Tab>

        <Tab eventKey="links" title="Links" className="col-xl-9">
          <URLInput
            lens={lens.focus("urls").defined()}
            type={ValidSiteTypeEnum.SCENE}
            errors={errors.urls}
          />

          <NavButtons onNext={() => setActiveTab("images")} />
        </Tab>

        <Tab eventKey="images" title="Images">
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

          <div className="d-flex">
            {/* dummy element for feedback */}
            <div className="ms-auto">
              <span className={file ? "is-invalid" : ""} />
              <Form.Control.Feedback type="invalid">
                Upload or remove image to continue.
              </Form.Control.Feedback>
            </div>
          </div>
        </Tab>
        <Tab eventKey="confirm" title="Confirm" className="mt-2 col-xl-9">
          {renderSceneDetails(newSceneChanges, oldSceneChanges, !!scene)}
          <Row className="my-4">
            <Col md={{ span: 8, offset: 4 }}>
              <EditNote register={register} error={errors.note} />
            </Col>
          </Row>

          {metadataErrors.length > 0 && (
            <div className="text-end my-4">
              <h6>
                <Icon icon={faExclamationTriangle} color="red" />
                <span className="ms-1">Errors</span>
              </h6>
              <div className="d-flex flex-column text-danger">
                {metadataErrors.map(({ error, tab }) => (
                  <Link to="#" key={error} onClick={() => setActiveTab(tab)}>
                    {error}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <SubmitButtons disabled={saving} />
        </Tab>
      </Tabs>
    </Form>
  );
};

export default SceneForm;
