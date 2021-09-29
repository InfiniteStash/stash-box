import { FC, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Row, Col, Form, Tab, Tabs } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";

import { Studio_findStudio as Studio } from "src/graphql/definitions/Studio";
import { StudioEditDetailsInput, ValidSiteTypeEnum } from "src/graphql";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { EditNote } from "src/components/form";
import URLInput from "src/components/urlInput";
import { renderStudioDetails } from "src/components/editCard/ModifyEdit";

import { StudioSchema, StudioFormData } from "./schema";
import DiffStudio from "./diff";

interface StudioProps {
  studio: Studio;
  callback: (data: StudioEditDetailsInput, editNote: string) => void;
  showNetworkSelect?: boolean;
  saving: boolean;
}

const StudioForm: FC<StudioProps> = ({
  studio,
  callback,
  showNetworkSelect = true,
  saving,
}) => {
  const history = useHistory();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StudioFormData>({
    resolver: yupResolver(StudioSchema),
    defaultValues: {
      name: studio.name,
      images: studio.images,
      urls: studio.urls ?? [],
      studio: studio.parent
        ? {
            id: studio.parent.id,
            name: studio.parent.name,
          }
        : undefined,
    },
  });

  const [file, setFile] = useState<File | undefined>();
  const fieldData = watch();
  const [oldStudioChanges, newStudioChanges] = useMemo(
    () => DiffStudio(StudioSchema.cast(fieldData), studio),
    [fieldData, studio]
  );

  const [activeTab, setActiveTab] = useState("details");

  const onSubmit = (data: StudioFormData) => {
    const callbackData: StudioEditDetailsInput = {
      name: data.name,
      urls: data.urls.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
      image_ids: data.images.map((i) => i.id),
      parent_id: data.studio?.id,
    };
    callback(callbackData, data.note);
  };

  return (
    <Form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => key && setActiveTab(key)}
        className="d-flex"
      >
        <Tab eventKey="details" title="Details" className="col-xl-9">
          <Form.Group controlId="name" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              className={cx({ "is-invalid": errors.name })}
              placeholder="Name"
              defaultValue={studio.name}
              {...register("name")}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {showNetworkSelect && (
            <Form.Group controlId="network" className="mb-3">
              <Form.Label>Network</Form.Label>
              <StudioSelect
                excludeStudio={studio.id}
                control={control}
                initialStudio={studio.parent}
                isClearable
                networkSelect
              />
            </Form.Group>
          )}

          <Row className="mt-1">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="me-1" onClick={() => setActiveTab("links")}>
              Next
            </Button>
          </Row>
        </Tab>

        <Tab eventKey="links" title="Links">
          <Form.Group className="mb-3">
            <Form.Label>Links</Form.Label>
            <URLInput control={control} type={ValidSiteTypeEnum.STUDIO} />
          </Form.Group>

          <Row className="mt-1">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="me-1" onClick={() => setActiveTab("images")}>
              Next
            </Button>
          </Row>
        </Tab>

        <Tab eventKey="images" title="Images">
          <Form.Group>
            <Form.Label>Images</Form.Label>
            <EditImages
              control={control}
              maxImages={1}
              file={file}
              setFile={(f) => setFile(f)}
            />
          </Form.Group>

          <Row className="mt-1">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="me-1" onClick={() => setActiveTab("confirm")}>
              Next
            </Button>
          </Row>
          <Row>
            {/* dummy element for feedback */}
            <span className={file ? "is-invalid" : ""} />
            <Form.Control.Feedback type="invalid">
              Upload or remove image to continue.
            </Form.Control.Feedback>
          </Row>
        </Tab>

        <Tab eventKey="confirm" title="Confirm" className="mt-2 col-xl-9">
          {renderStudioDetails(newStudioChanges, oldStudioChanges, true)}
          <Col md={{ span: 8, offset: 4 }}>
            <EditNote register={register} error={errors.note} />
          </Col>

          <Row className="mt-2">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled
              className="d-none"
              aria-hidden="true"
            />
            <Button type="submit" disabled={!!file || saving}>
              Submit Edit
            </Button>
          </Row>
        </Tab>
      </Tabs>
    </Form>
  );
};

export default StudioForm;
