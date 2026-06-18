import { faEdit } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import { List } from "src/components/list";
import { Button, buttonVariants } from "src/components/ui/button";
import { Label } from "src/components/ui/field";
import { Select } from "src/components/ui/select";
import { Switch } from "src/components/ui/switch";
import { ROUTE_NOTIFICATION_SUBSCRIPTIONS } from "src/constants/route";
import {
  NotificationEnum,
  useMarkNotificationsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "src/graphql";
import { useCurrentUser, usePagination, useQueryParams } from "src/hooks";
import { NotificationType, resolveEnum, userHref } from "src/utils";
import { Notification } from "./Notification";

const PER_PAGE = 20;

const Notifications: FC = () => {
  const { user } = useCurrentUser();
  const { page, setPage } = usePagination();
  const [params, setParams] = useQueryParams({
    notification: { name: "notification", type: "string", default: "all" },
    unread: { name: "unread", type: "string", default: "false" },
  });
  const notification = resolveEnum(
    NotificationEnum,
    params.notification,
    undefined,
  );
  const unread = params.unread === "true";

  const { data: unreadNotificationsCount } = useUnreadNotificationsCount();
  const [markNotificationsRead, { loading: markingRead }] =
    useMarkNotificationsRead();
  const { loading, data } = useNotifications({
    input: {
      page,
      per_page: PER_PAGE,
      unread_only: unread,
      type: notification,
    },
  });

  if (loading) return <LoadingIndicator message="Loading notifications..." />;

  if (!loading && !data) return <ErrorMessage error="No notifications" />;

  const enumToOptions = (e: Record<string, string>) =>
    Object.keys(e).map((key) => (
      <option key={key} value={key}>
        {e[key]}
      </option>
    ));

  return (
    <>
      <div className="flex items-center">
        <h3 className="mr-4">Notifications</h3>
        {user && (
          <>
            <Link
              to={userHref(user, ROUTE_NOTIFICATION_SUBSCRIPTIONS)}
              className={`ml-auto ${buttonVariants({ variant: "link" })}`}
            >
              <Icon icon={faEdit} className="mr-2" />
              Edit Subscriptions
            </Link>
            <Button
              className="ml-2"
              onClick={() => markNotificationsRead()}
              disabled={
                markingRead ||
                !unreadNotificationsCount?.getUnreadNotificationCount.total
              }
            >
              Mark all as read
            </Button>
          </>
        )}
      </div>
      <List
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        listCount={data?.queryNotifications.count}
        filters={
          <>
            <div className="mx-2 mb-3 flex flex-col gap-1">
              <Label>Notification Type</Label>
              <Select
                onChange={(e) =>
                  setParams("notification", e.currentTarget.value)
                }
                value={notification}
                className="max-w-[250px]"
              >
                <option value="all" key="all-types">
                  All
                </option>
                {enumToOptions(NotificationType)}
              </Select>
            </div>

            <div className="flex flex-col gap-1 text-center">
              <Label>Unread Only</Label>
              <Switch
                className="mt-2 justify-center"
                defaultChecked={unread}
                onCheckedChange={(checked) =>
                  setParams("unread", checked.toString())
                }
              />
            </div>
          </>
        }
        loading={loading}
        entityName="notifications"
      >
        {data?.queryNotifications?.notifications?.map((n) => (
          <Notification
            key={`${n.created}-${n.data.__typename}`}
            notification={n}
          />
        ))}
      </List>
    </>
  );
};

export default Notifications;
