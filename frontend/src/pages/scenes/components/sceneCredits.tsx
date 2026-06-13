import type { FC } from "react";
import { useMemo } from "react";
import PerformerCard from "src/components/performerCard";
import type { SceneFragment as Scene } from "src/graphql";

interface Props {
  scene: Pick<Scene, "credits">;
}

export const SceneCredits: FC<Props> = ({ scene }) => {
  const creditsByType = useMemo(() => {
    const grouped = new Map<number, Scene["credits"]>();

    scene.credits.forEach((credit) => {
      const id = credit.credit_type.id;
      const existingCredits = grouped.get(id);
      if (existingCredits) {
        existingCredits.push(credit);
      } else {
        grouped.set(id, [credit]);
      }
    });

    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, [scene.credits]);

  if (scene.credits.length === 0) {
    return (
      <div className="scene-credits my-4">
        <h6>No credits found for this scene.</h6>
      </div>
    );
  }

  return (
    <div className="scene-credits my-4">
      {creditsByType.map(([, credits]) => (
        <div
          key={credits[0].credit_type.id}
          className="scene-credits-role mb-4"
        >
          <h4 className="mb-3">{credits[0].credit_type.name}</h4>
          <div className="scene-credits-role-performers">
            {credits.map((credit) => (
              <div
                key={`${credit.performer.id}-${credit.as ?? ""}`}
                className="scene-credits-role-performer card"
              >
                <PerformerCard performer={credit.performer} hideFooter />
                <div className="scene-credits-role-performer-details">
                  <h5>{credit.performer.name}</h5>
                  {credit.as && (
                    <div className="scene-credit-alias">
                      as <em>{credit.as}</em>
                    </div>
                  )}
                  {credit.attributes.length > 0 && (
                    <div className="scene-credit-tags">
                      {credit.attributes.map((attr) => (
                        <span key={attr.id} className="badge bg-secondary me-1">
                          {attr.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
