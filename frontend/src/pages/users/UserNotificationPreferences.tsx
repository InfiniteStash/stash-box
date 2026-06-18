import { faCircle } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { ROUTE_NOTIFICATIONS } from "src/constants/route";
import {
  NotificationEnum,
  NotificationLevel,
  useUpdateNotificationSubscriptions,
} from "src/graphql";
import {
  EditingNotificationType,
  ensureEnum,
  GeneralNotificationType,
  VotingNotificationType,
} from "src/utils";
import { useCurrentUser } from "../../hooks";

interface Props {
  user: {
    id: string;
    notification_subscriptions: NotificationEnum[];
  };
}

export const UserNotificationPreferences: FC<Props> = ({ user }) => {
  const { isEditor, isVoter } = useCurrentUser();

  const [updateSubscriptions, { loading: submitting }] =
    useUpdateNotificationSubscriptions();
  const activeNotifications: string[] = user.notification_subscriptions.map(
    (e) => e,
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subscriptions = data
      .getAll("subscriptions")
      .map((sub) => ensureEnum(NotificationEnum, sub.toString()));

    updateSubscriptions({ variables: { subscriptions } });
  };

  const renderSection = (
    title: string,
    entries: Record<string, string>,
    enabled: boolean,
    level: NotificationLevel,
  ) => {
    const isUrgent = level === NotificationLevel.URGENT;
    return (
      <>
        <h5 className="mt-4 flex items-center gap-2">
          <Icon
            icon={faCircle}
            className={isUrgent ? "text-destructive" : "text-primary"}
            title={isUrgent ? "Urgent" : "Normal"}
          />
          {title}
        </h5>
        {Object.entries(entries).map(([key, value]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              value={key}
              defaultChecked={enabled && activeNotifications.includes(key)}
              disabled={!enabled}
              id={key}
              name="subscriptions"
            />
            <span>{value}</span>
          </label>
        ))}
      </>
    );
  };

  return (
    <>
      <Link to={ROUTE_NOTIFICATIONS} className="text-link hover:underline">
        <h6 className="mb-4">&larr; Notifications</h6>
      </Link>
      <h4>Active notification subscriptions</h4>
      <hr className="border-border" />

      <form onSubmit={handleSubmit}>
        {renderSection(
          "General",
          GeneralNotificationType,
          true,
          NotificationLevel.NORMAL,
        )}
        {renderSection(
          "Voting",
          VotingNotificationType,
          isVoter,
          NotificationLevel.URGENT,
        )}
        {renderSection(
          "Editing",
          EditingNotificationType,
          isEditor,
          NotificationLevel.URGENT,
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" type="reset">
            Reset
          </Button>
          <Button type="submit" disabled={submitting}>
            Save
          </Button>
        </div>
      </form>
    </>
  );
};
