import { Link } from "react-router-dom";
import { GenderIcon, PerformerName, TagLink } from "src/components/fragments";
import { ROUTE_SCENES } from "src/constants";
import type { FingerprintAlgorithm, PerformerFragment } from "src/graphql";
import { createHref, formatDuration, performerHref, tagHref } from "src/utils";

type Appearance = {
  performer: PerformerFragment;
  as: string;
};

type CreditAppearance = {
  as?: string | null;
  performer: Pick<
    Appearance["performer"],
    "name" | "id" | "gender" | "disambiguation" | "deleted"
  >;
  credit_type?: {
    id: number;
    name: string;
    description?: string;
  };
  attributes?: Array<{
    id: number;
    name: string;
    description?: string | null;
  }>;
};

export const renderPerformer = (appearance: CreditAppearance) => (
  <div key={appearance.performer.id}>
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <Link to={performerHref(appearance.performer)}>
        <GenderIcon gender={appearance.performer.gender} />
        <PerformerName performer={appearance.performer} as={appearance.as} />
      </Link>
    </div>
    <div>
      {appearance.credit_type && (
        <span className="badge bg-secondary me-1">
          {appearance.credit_type.name}
        </span>
      )}
      {appearance.attributes?.map((attr) => (
        <span key={attr.id} className="badge bg-info me-1">
          {attr.name}
        </span>
      ))}
    </div>
  </div>
);

export const renderTag = (tag: {
  id: string;
  name: string;
  description?: string | null;
}) => (
  <TagLink title={tag.name} link={tagHref(tag)} description={tag.description} />
);

export const renderFingerprint = (fingerprint: {
  hash: string;
  duration: number;
  algorithm: FingerprintAlgorithm;
}) => (
  <>
    <Link to={`${createHref(ROUTE_SCENES)}?fingerprint=${fingerprint.hash}`}>
      {fingerprint.algorithm}: {fingerprint.hash}
    </Link>
    <span title={`${fingerprint.duration}s`}>
      {", duration: "}
      {formatDuration(fingerprint.duration)}
    </span>
  </>
);
