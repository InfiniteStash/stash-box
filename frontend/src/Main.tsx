import { faBell as faBellOutlined } from "@fortawesome/free-regular-svg-icons";
import {
  faBars,
  faBell,
  faBook,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "src/components/fragments";
import SearchField, { SearchType } from "src/components/searchField";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  ROUTE_ACTIVATE,
  ROUTE_AUDITS,
  ROUTE_DRAFTS,
  ROUTE_EDITS,
  ROUTE_FORGOT_PASSWORD,
  ROUTE_HOME,
  ROUTE_LOGIN,
  ROUTE_LOGOUT,
  ROUTE_NOTIFICATIONS,
  ROUTE_PERFORMERS,
  ROUTE_REGISTER,
  ROUTE_RESET_PASSWORD,
  ROUTE_SCENES,
  ROUTE_SITES,
  ROUTE_STUDIOS,
  ROUTE_TAGS,
  ROUTE_USERS,
} from "src/constants/route";
import { useConfig, useUnreadNotificationsCount } from "src/graphql";
import { useAuth } from "src/hooks";
import { cn } from "src/lib/utils";
import { canEdit, isAdmin, setCachedUser, userHref } from "src/utils";
import { getCredentialsSetting, getPlatformURL } from "src/utils/createClient";
import AuthContext from "./context";

interface Props {
  children?: React.ReactNode;
}

const Main: FC<Props> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, user } = useAuth();
  const { data: unreadNotifications } = useUnreadNotificationsCount();
  const unreadCounts = unreadNotifications?.getUnreadNotificationCount;
  const notificationCount = unreadCounts?.total || null;
  const hasUrgent = (unreadCounts?.urgent ?? 0) > 0;
  const { data: configData } = useConfig();
  const [mobileOpen, setMobileOpen] = useState(false);

  const guidelinesURL = configData?.getConfig.guidelines_url;

  useEffect(() => {
    if (loading || user) return;

    if (
      location.pathname !== ROUTE_ACTIVATE &&
      location.pathname !== ROUTE_REGISTER &&
      location.pathname !== ROUTE_LOGIN &&
      location.pathname !== ROUTE_FORGOT_PASSWORD &&
      location.pathname !== ROUTE_RESET_PASSWORD
    ) {
      const redirect =
        location.pathname === "/"
          ? ""
          : `?redirect=${encodeURIComponent(location.pathname)}`;
      navigate(`${ROUTE_LOGIN}${redirect}`);
    }
  }, [loading, user, location, navigate]);

  const contextValue = {
    authenticated: user !== undefined,
    user,
  };

  if (!contextValue.authenticated)
    return (
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    );

  const handleLogout = async () => {
    const res = await fetch(`${getPlatformURL()}logout`, {
      credentials: getCredentialsSetting(),
    });
    setCachedUser();
    if (res.ok) window.location.href = ROUTE_LOGIN;
    return false;
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-foreground",
      isActive ? "font-medium text-link" : "text-foreground/85",
    );

  const mainLinks = [
    { to: ROUTE_HOME, label: "Home" },
    { to: ROUTE_PERFORMERS, label: "Performers" },
    { to: ROUTE_SCENES, label: "Scenes" },
    { to: ROUTE_STUDIOS, label: "Studios" },
    { to: ROUTE_TAGS, label: "Tags" },
    { to: ROUTE_EDITS, label: "Edits" },
    ...(canEdit(user) ? [{ to: ROUTE_DRAFTS, label: "Drafts" }] : []),
    { to: ROUTE_SITES, label: "Sites" },
    ...(isAdmin(user) ? [{ to: ROUTE_AUDITS, label: "Audits" }] : []),
  ];

  const closeMenu = () => setMobileOpen(false);

  const renderMainLinks = () =>
    mainLinks.map(({ to, label }) => (
      <NavLink key={to} to={to} className={linkClass} onClick={closeMenu}>
        {label}
      </NavLink>
    ));

  const renderGuidelines = () =>
    guidelinesURL && (
      <a
        href={guidelinesURL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
      >
        <Icon icon={faBook} />
        Guidelines
      </a>
    );

  const renderUserLinks = () =>
    contextValue.user && (
      <>
        <NavLink
          to={userHref(contextValue.user)}
          className={(s) => cn(linkClass(s), "inline-flex items-center gap-2")}
          onClick={closeMenu}
        >
          <Icon icon={faUser} />
          {contextValue.user.name}
        </NavLink>
        {isAdmin(user) && (
          <NavLink to={ROUTE_USERS} className={linkClass} onClick={closeMenu}>
            Users
          </NavLink>
        )}
        <NavLink
          to={ROUTE_LOGOUT}
          onClick={() => {
            closeMenu();
            handleLogout();
          }}
          className={linkClass}
        >
          Logout
        </NavLink>
      </>
    );

  return (
    <div>
      <header className="bg-secondary">
        <div className="flex h-14 items-center gap-2 px-4">
          <Button
            variant="minimal"
            size="sm"
            className="md:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Icon icon={faBars} />
          </Button>

          <nav className="hidden items-center gap-0.5 md:flex">
            {renderMainLinks()}
            {renderGuidelines()}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Link to={ROUTE_NOTIFICATIONS} className="relative">
              <Button variant="minimal" size="sm" aria-label="Notifications">
                <Icon icon={notificationCount ? faBell : faBellOutlined} />
              </Button>
              {notificationCount && (
                <Badge
                  variant={hasUrgent ? "danger" : "primary"}
                  className="absolute -right-1 -top-1"
                >
                  {notificationCount}
                </Badge>
              )}
            </Link>

            <nav className="hidden items-center gap-0.5 md:flex">
              {renderUserLinks()}
            </nav>

            <div className="hidden sm:block sm:w-56 lg:w-72">
              <SearchField searchType={SearchType.Combined} nav showAllLink />
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav className="flex flex-col gap-0.5 border-t border-border px-4 pb-3 md:hidden">
            <div className="my-2 sm:hidden">
              <SearchField searchType={SearchType.Combined} nav showAllLink />
            </div>
            {renderMainLinks()}
            {renderGuidelines()}
            <div className="my-1 border-t border-border" />
            {renderUserLinks()}
          </nav>
        )}
      </header>
      <AuthContext.Provider value={contextValue}>
        <main className="px-4 py-4">{children}</main>
      </AuthContext.Provider>
    </div>
  );
};

export default Main;
