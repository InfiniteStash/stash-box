import { CombinedGraphQLErrors } from "@apollo/client";
import {
  faMinus,
  faPlus,
  faSyncAlt,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { sortBy } from "lodash-es";
import { type FC, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, Tooltip } from "src/components/fragments";
import Modal from "src/components/modal";
import { Button, buttonVariants } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Table } from "src/components/ui/table";
import { EditStatusTypes, VoteTypes } from "src/constants";
import {
  ROUTE_USER_EDIT,
  ROUTE_USER_EDITS,
  ROUTE_USER_MY_FINGERPRINTS,
  ROUTE_USER_PASSWORD,
  ROUTE_USERS,
} from "src/constants/route";
import {
  type GenerateInviteCodeInput,
  type PublicUserQuery,
  type UserQuery,
  useConfig,
  useDeleteUser,
  useGenerateInviteCodes,
  useGrantInvite,
  useRegenerateAPIKey,
  useRequestChangeEmail,
  useRescindInviteCode,
  useRevokeInvite,
  VoteStatusEnum,
  VoteTypeEnum,
} from "src/graphql";
import { useCurrentUser, useToast } from "src/hooks";
import { createHref, formatDateTime, isPrivateUser } from "src/utils";
import { GenerateInviteKeyModal } from "./GenerateInviteKeyModal";

interface IInviteKeys {
  id: string;
  uses?: number | null | undefined;
  expires?: string | null | undefined;
}

interface UserInviteKeysProps {
  inviteCodes: IInviteKeys[];
  rescindInvite: (id: string) => void;
}

const UserInviteKeys: FC<UserInviteKeysProps> = ({
  inviteCodes,
  rescindInvite,
}) => {
  if (inviteCodes.length === 0) return null;

  return (
    <Table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Uses</th>
          <th>Expires</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {inviteCodes.map((ic) => (
          <tr key={ic.id}>
            <td>
              <div className="mb-2 flex items-center gap-2">
                <code>{ic.id}</code>
                <Button onClick={() => navigator.clipboard?.writeText(ic.id)}>
                  Copy
                </Button>
              </div>
            </td>
            <td>{(ic.uses ?? 0) === 0 ? "unlimited" : ic.uses}</td>
            <td>
              {ic.expires ? (
                <span>{formatDateTime(ic.expires, true)}</span>
              ) : (
                "never"
              )}
            </td>
            <td>
              <Button variant="danger" onClick={() => rescindInvite(ic.id)}>
                <Icon icon={faTrash} />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

type User = NonNullable<UserQuery["findUser"]>;
type EditCounts = User["edit_count"];
type VoteCounts = User["vote_count"];

type PublicUser = NonNullable<PublicUserQuery["findUser"]>;

type EditCount = [VoteStatusEnum, number, number];
const filterEdits = (editCount: EditCounts): EditCount[] => {
  const edits = Object.entries(editCount)
    .filter(([status]) => !status.endsWith("_bot"))
    .map(([status, count]) => {
      const resolvedStatus =
        VoteStatusEnum[status.toUpperCase() as VoteStatusEnum];
      if (!resolvedStatus) return undefined;
      const bot = editCount[`${status}_bot` as keyof EditCounts] as number;
      return [EditStatusTypes[resolvedStatus], count, bot];
    })
    .filter((val): val is EditCount => val !== undefined);
  return sortBy(edits, (value) => value[0]);
};

const hasBotEdits = (editCount: EditCounts): boolean =>
  Object.entries(editCount).some(
    ([k, v]) => k.endsWith("_bot") && typeof v === "number" && v > 0,
  );

type VoteCount = [VoteTypeEnum, number];
const filterVotes = (voteCount: VoteCounts): VoteCount[] => {
  const votes = Object.entries(voteCount)
    .map(([status, count]) => {
      const resolvedStatus = VoteTypeEnum[status.toUpperCase() as VoteTypeEnum];
      return resolvedStatus ? [VoteTypes[resolvedStatus], count] : undefined;
    })
    .filter((val): val is VoteCount => val !== undefined);
  return sortBy(votes, (value) => value[0]);
};

interface Props {
  user: User | PublicUser;
  refetch: () => void;
}

const UserComponent: FC<Props> = ({ user, refetch }) => {
  const { isAdmin, isSelf } = useCurrentUser();
  const { data: configData } = useConfig();
  const [showDelete, setShowDelete] = useState(false);
  const [showRegenerateAPIKey, setShowRegenerateAPIKey] = useState(false);
  const [showRescindCode, setShowRescindCode] = useState<string | undefined>();
  const [showGenerateInviteKey, setShowGenerateInviteKey] = useState(false);
  const toast = useToast();

  const [deleteUser, { loading: deleting }] = useDeleteUser();
  const [regenerateAPIKey] = useRegenerateAPIKey();
  const [rescindInviteCode] = useRescindInviteCode();
  const [generateInviteCode] = useGenerateInviteCodes();
  const [grantInvite] = useGrantInvite();
  const [revokeInvite] = useRevokeInvite();
  const [requestChangeEmail] = useRequestChangeEmail();

  const showPrivate = isPrivateUser(user);
  const isOwner = showPrivate && isSelf(user);

  const endpointURL = configData && `${configData.getConfig.host_url}/graphql`;

  const toggleModal = () => setShowDelete(true);
  const handleDelete = (status: boolean): void => {
    if (status)
      deleteUser({ variables: { input: { id: user.id } } }).then(() => {
        window.location.href = ROUTE_USERS;
      });
    setShowDelete(false);
  };
  const deleteModal = showDelete && (
    <Modal
      message={`Are you sure you want to delete '${user.name}'? This operation cannot be undone.`}
      callback={handleDelete}
    />
  );

  const handleRegenerateAPIKey = (status: boolean): void => {
    if (status) {
      const userID = isSelf(user.id) ? null : user.id;
      regenerateAPIKey({ variables: { user_id: userID } }).then(() => {
        refetch();
      });
    }
    setShowRegenerateAPIKey(false);
  };
  const regenerateAPIKeyModal = showRegenerateAPIKey && (
    <Modal callback={handleRegenerateAPIKey} acceptTerm="Confirm">
      <p>
        Are you sure you want to regenerate the API key? The old key will be
        removed and can no longer be used.
      </p>
      <p>
        <i>This operation cannot be undone.</i>
      </p>
    </Modal>
  );

  const handleRescindCode = (status: boolean): void => {
    if (status) {
      rescindInviteCode({ variables: { code: showRescindCode ?? "" } }).then(
        () => {
          refetch();
        },
      );
    }

    setShowRescindCode(undefined);
  };
  const rescindCodeModal = showRescindCode && (
    <Modal
      message={`Are you sure you want to rescind code '${showRescindCode}'? This operation cannot be undone.`}
      callback={handleRescindCode}
    />
  );

  const handleGenerateCode = (input: GenerateInviteCodeInput) => {
    generateInviteCode({
      variables: {
        input,
      },
    }).then(() => {
      refetch();
    });
  };

  const generateInviteCodeModal = showGenerateInviteKey && (
    <GenerateInviteKeyModal
      callback={(i) => {
        if (i) {
          handleGenerateCode(i);
        }
        setShowGenerateInviteKey(false);
      }}
    />
  );

  const handleGrantInvite = () => {
    grantInvite({
      variables: {
        input: {
          amount: 1,
          user_id: user.id,
        },
      },
    }).then(() => {
      refetch();
    });
  };

  const handleRevokeInvite = () => {
    revokeInvite({
      variables: {
        input: {
          amount: 1,
          user_id: user.id,
        },
      },
    }).then(() => {
      refetch();
    });
  };

  const handleChangeEmail = () => {
    requestChangeEmail()
      .then(() => {
        toast({
          variant: "success",
          content: (
            <>
              <h5>Change email</h5>
              <div>Please check your existing email to continue.</div>
            </>
          ),
        });
      })
      .catch((error: unknown) => {
        let message: React.ReactNode | string | undefined =
          CombinedGraphQLErrors.is(error) && error.message;
        if (message === "pending-email-change")
          message = (
            <>
              <h5>Pending email change</h5>
              <div>Email change already requested. Please try again later.</div>
            </>
          );
        toast({ variant: "danger", content: message });
      });
  };

  const editCount = filterEdits(user.edit_count);
  const showBotEdits = hasBotEdits(user.edit_count);
  const voteCount = filterVotes(user.vote_count);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-center gap-2">
        <h3>{user.name}</h3>
        {deleteModal}
        {regenerateAPIKeyModal}
        {generateInviteCodeModal}
        {rescindCodeModal}
        <div className="ml-auto flex flex-wrap gap-2">
          <Link
            to={createHref(ROUTE_USER_EDITS, user)}
            className={buttonVariants({ variant: "secondary" })}
          >
            User Edits
          </Link>
          {isOwner && (
            <>
              <Link
                to={ROUTE_USER_MY_FINGERPRINTS}
                className={buttonVariants({ variant: "secondary" })}
              >
                My Fingerprints
              </Link>
              <Link to={ROUTE_USER_PASSWORD} className={buttonVariants()}>
                Change Password
              </Link>
            </>
          )}
          {isOwner && (
            <Button onClick={() => handleChangeEmail()}>Change Email</Button>
          )}
          {isAdmin && (
            <>
              <Link
                to={createHref(ROUTE_USER_EDIT, user)}
                className={buttonVariants()}
              >
                Edit User
              </Link>
              <Button
                variant="danger"
                disabled={showDelete || deleting}
                onClick={toggleModal}
              >
                Delete User
              </Button>
            </>
          )}
        </div>
      </div>
      <hr className="border-border" />
      {showPrivate && (
        <>
          <div className="grid grid-cols-12">
            <div className="col-span-2">Email</div>
            <div className="col-span-10">{user.email}</div>
          </div>
          <div className="grid grid-cols-12">
            <div className="col-span-2">Roles</div>
            <div className="col-span-10">{(user.roles ?? []).join(", ")}</div>
          </div>
          <div className="my-3 grid grid-cols-12 items-baseline">
            <div className="col-span-2">API key</div>
            <div className="col-span-10 flex gap-2">
              <Input value={user.api_key ?? ""} disabled />
              <Button
                onClick={() =>
                  navigator.clipboard?.writeText(user.api_key ?? "")
                }
              >
                Copy to Clipboard
              </Button>
              <Tooltip text="Regenerate API Key" placement="top-end">
                <Button
                  variant="danger"
                  disabled={showRegenerateAPIKey}
                  onClick={() => setShowRegenerateAPIKey(true)}
                >
                  <Icon icon={faSyncAlt} />
                </Button>
              </Tooltip>
            </div>
          </div>
          {endpointURL && (
            <div className="my-3 grid grid-cols-12 items-baseline">
              <div className="col-span-2">GraphQL Endpoint</div>
              <div className="col-span-10 flex gap-2">
                <Input value={endpointURL} disabled />
                <Button
                  onClick={() => navigator.clipboard?.writeText(endpointURL)}
                >
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Table>
          <thead>
            <tr>
              <th>Edits</th>
              <th>Count</th>
              {showBotEdits && <th>Bot</th>}
            </tr>
          </thead>
          <tbody>
            {editCount.map(([status, count, bot]) => (
              <tr key={status}>
                <td>{status}</td>
                <td>{count}</td>
                {showBotEdits && <td>{bot}</td>}
              </tr>
            ))}
          </tbody>
        </Table>
        <Table>
          <thead>
            <tr>
              <th>Votes</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {voteCount.map(([vote, count]) => (
              <tr key={vote}>
                <td>{vote}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      {showPrivate && (
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-2">Invite Tokens</div>
          <div className="col-span-10 flex items-center gap-2">
            {isAdmin && (
              <Button onClick={() => handleRevokeInvite()}>
                <Icon icon={faMinus} />
              </Button>
            )}
            <span>{user.invite_tokens ?? 0}</span>
            {isAdmin && (
              <Button onClick={() => handleGrantInvite()}>
                <Icon icon={faPlus} />
              </Button>
            )}
          </div>
        </div>
      )}
      {showPrivate && (
        <div className="mt-3">
          <div>Invite Keys</div>
          <div className="my-2">
            {isOwner && (
              <Button
                variant="link"
                onClick={() => setShowGenerateInviteKey(true)}
                disabled={user.invite_tokens === 0}
              >
                <Icon icon={faPlus} className="mr-2" />
                Generate Key
              </Button>
            )}
            <UserInviteKeys
              inviteCodes={user.invite_codes ?? []}
              rescindInvite={(c) => setShowRescindCode(c)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserComponent;
