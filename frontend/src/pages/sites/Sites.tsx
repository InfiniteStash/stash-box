import { groupBy, sortBy } from "lodash-es";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { LoadingIndicator, SiteLink } from "src/components/fragments";
import { Button } from "src/components/ui/button";
import { Card, CardBody } from "src/components/ui/card";
import { ROUTE_SITE_ADD, ROUTE_SITE_CATEGORIES } from "src/constants/route";
import { useSites } from "src/graphql";
import { useCurrentUser } from "src/hooks";

const SiteList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useSites();

  const sites = sortBy(data?.querySites.sites ?? [], (s) =>
    s.name.toLowerCase(),
  );

  const hasCategories = sites.some((s) => s.category);
  const groups = sortBy(
    Object.values(groupBy(sites, (s) => s.category?.id ?? "")),
    [
      (group) => (group[0].category ? 0 : 1),
      (group) => group[0].category?.sort_order ?? 0,
      (group) => group[0].category?.name.toLowerCase(),
    ],
  );

  const renderSite = (site: (typeof sites)[number]) => (
    <li key={site.id}>
      <SiteLink site={site} noMargin />
      {site.description && (
        <span className="ml-2 text-muted-foreground">
          &bull; <small className="ml-2">{site.description}</small>
        </span>
      )}
    </li>
  );

  return (
    <>
      <div className="mb-4 flex items-center">
        <h3 className="text-2xl font-semibold">Sites</h3>
        {isAdmin && (
          <div className="ml-auto flex gap-2">
            <Link to={ROUTE_SITE_CATEGORIES}>
              <Button variant="secondary">Categories</Button>
            </Link>
            <Link to={ROUTE_SITE_ADD}>
              <Button>Create</Button>
            </Link>
          </div>
        )}
      </div>
      <Card>
        <CardBody>
          {loading && <LoadingIndicator message="Loading sites..." />}
          {!hasCategories ? (
            <ul className="space-y-1">{sites.map(renderSite)}</ul>
          ) : (
            groups.map((group) => (
              <div key={group[0].category?.id ?? "other"} className="mb-4">
                <h6 className="mb-1 text-lg font-semibold">
                  {group[0].category?.name ?? "Other"}
                </h6>
                <ul className="space-y-1">{group.map(renderSite)}</ul>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </>
  );
};

export default SiteList;
