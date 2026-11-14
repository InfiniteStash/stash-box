import cx from "classnames";
import { type FC, useEffect, useState } from "react";
import DragList from "src/components/dragList";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Modal from "src/components/modal";
import Title from "src/components/title";
import { Button } from "src/components/ui/button";
import { Card, CardBody, CardHeader } from "src/components/ui/card";
import { Switch } from "src/components/ui/switch";
import {
  type ImageTypeEnum,
  type ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
  useImageTypeGroups,
  useSetImageTypeEnabled,
  useUpdateImageTypeOrder,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { errorMessage } from "src/utils";

const CLASSNAME = "ImageTypeOrder";

type OrderedGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

const ImageTypeOrder: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useImageTypeGroups({ includeDisabled: true });
  const [updateOrder, { loading: savingOrder }] = useUpdateImageTypeOrder();
  const [setEnabled, { loading: savingEnabled }] = useSetImageTypeEnabled();
  const saving = savingOrder || savingEnabled;

  const [groups, setGroups] = useState<OrderedGroup[]>([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (data?.imageTypeGroups) setGroups(data.imageTypeGroups);
  }, [data]);

  if (!isAdmin) return <ErrorMessage error="Forbidden" />;
  if (loading) return <LoadingIndicator message="Loading image types..." />;

  const reorderGroups = (next: OrderedGroup[]) => {
    setSaved(false);
    setGroups(next);
  };

  const reorderTypes = (
    groupKey: ImageTypeGroupEnum,
    types: OrderedGroup["types"],
  ) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group) =>
        group.key === groupKey ? { ...group, types } : group,
      ),
    );
  };

  const toggleGroup = (key: ImageTypeGroupEnum) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group) =>
        group.key === key ? { ...group, enabled: !group.enabled } : group,
      ),
    );
  };

  const toggleType = (key: ImageTypeEnum) => {
    setSaved(false);
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        types: group.types.map((type) =>
          type.key === key ? { ...type, enabled: !type.enabled } : type,
        ),
      })),
    );
  };

  const save = () => {
    setConfirming(false);
    setError(undefined);

    updateOrder({
      variables: {
        input: {
          // Both lists go complete: a partial ordering is rejected rather than
          // merged so an admin cannot half-apply a reordering
          groups: groups.map((group) => group.key),
          types: groups.flatMap((group) => group.types.map((type) => type.key)),
        },
      },
    })
      .then(() =>
        setEnabled({
          variables: {
            input: {
              disabled_groups: groups
                .filter((group) => !group.enabled)
                .map((group) => group.key),
              disabled_types: groups.flatMap((group) =>
                group.types
                  .filter((type) => !type.enabled)
                  .map((type) => type.key),
              ),
            },
          },
        }),
      )
      .then(() => setSaved(true))
      .catch((e: unknown) => setError(errorMessage(e)));
  };

  return (
    <>
      <Title page="Image Types" />
      <div className="flex items-center mb-2">
        <h3 className="mr-4">Image Types</h3>
        <Button
          onClick={() => setConfirming(true)}
          disabled={saving}
          className="ml-auto"
        >
          {saving ? "Saving..." : "Save Order"}
        </Button>
      </div>

      <p className="text-muted-foreground">
        Which of the vocabulary this instance uses, and which image ranks first{" "}
        <b>instance-wide</b>. Groups are compared in this order, and within a
        group its types are. Drag by the handles to reorder, or focus a handle
        and use the arrow keys. Users may reorder all of this for themselves:
        what you set here is the default they start from
      </p>
      <p className="text-muted-foreground">
        Switching something off hides it when labelling and drops it from
        ranking. <b>Nothing is deleted</b>: labels already applied are kept and
        come back if you switch it on again.
      </p>

      {error && <div className="text-destructive mb-2">Error: {error}</div>}
      {saved && <div className="text-success mb-2">Order saved.</div>}

      <div className={CLASSNAME}>
        <DragList
          className="is-block"
          items={groups}
          keyOf={(group) => group.key}
          labelOf={(group) => `the ${group.name} group`}
          onReorder={reorderGroups}
        >
          {(group) => (
            <Card
              className={cx(`${CLASSNAME}-group`, "mb-3", {
                disabled: !group.enabled,
              })}
            >
              <CardHeader className="flex-row flex-wrap items-center gap-2">
                <b>{group.name}</b>
                {group.description && (
                  <small className="text-muted-foreground ml-2">
                    {group.description}
                  </small>
                )}
                <Switch
                  className="ml-auto"
                  id={`enabled-${group.key}`}
                  label={group.enabled ? "In use" : "Off"}
                  checked={group.enabled}
                  onCheckedChange={() => toggleGroup(group.key)}
                />
              </CardHeader>
              <CardBody>
                <DragList
                  items={group.types}
                  keyOf={(type) => type.key}
                  labelOf={(type) => type.name}
                  onReorder={(types) => reorderTypes(group.key, types)}
                >
                  {(type) => (
                    <>
                      <span
                        className={cx({
                          // A type inside a switched-off group is unusable
                          // whatever its own setting, so it reads as off
                          "text-muted-foreground":
                            !type.enabled || !group.enabled,
                        })}
                      >
                        {type.name}
                      </span>
                      {type.description && (
                        <small className="text-muted-foreground">
                          {type.description}
                        </small>
                      )}
                      <Switch
                        className="ml-auto"
                        id={`enabled-${type.key}`}
                        label={type.enabled ? "In use" : "Off"}
                        checked={type.enabled}
                        disabled={!group.enabled}
                        title={
                          group.enabled
                            ? undefined
                            : `${group.name} is switched off, so none of its types are in use`
                        }
                        onCheckedChange={() => toggleType(type.key)}
                      />
                    </>
                  )}
                </DragList>
              </CardBody>
            </Card>
          )}
        </DragList>
      </div>

      {confirming && (
        <Modal
          acceptTerm="Save for everyone"
          cancelTerm="Cancel"
          callback={(confirmed) => (confirmed ? save() : setConfirming(false))}
        >
          <p>
            This changes the ranking for <b>every user on this instance</b>, not
            just you.
          </p>
          <p className="mb-0">
            To change only your own ordering, use <b>Image preferences</b> on
            your user page instead.
          </p>
        </Modal>
      )}
    </>
  );
};

export default ImageTypeOrder;
