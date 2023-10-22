import { SceneCreditType, PerformerFragment } from 'src/graphql';
import { Link } from 'react-router-dom';
import { performerHref } from 'src/utils';
import { GenderIcon, PerformerName } from 'src/components/fragments';

interface Performer {
  as?: string | null;
  type: SceneCreditType;
  performer: Pick<PerformerFragment, 'id' | 'name' | 'disambiguation' | 'deleted' | 'gender'>;
}

export const PerformersLinks: React.FC<{ performers: Performer[] }>= ({ performers }) => (
  <>{
  performers
    .map(({ performer, as }) => (
        <Link
          key={performer.id}
          to={performerHref(performer)}
          className="scene-performer"
        >
          <GenderIcon gender={performer.gender} />
          <PerformerName performer={performer} as={as} />
        </Link>
      )
    )
    .map((p, index) => (index % 2 === 2 ? [" • ", p] : p))
  }
  </>
);
