import SceneDraft from "./SceneDraft";
import PerformerDraft from "./PerformerDraft";
import { DraftFragment } from "src/graphql";

const DraftComponent: React.FC<{ draft: DraftFragment }> = ({ draft }) => {
  if (draft.data.__typename === "SceneDraft")
    return <SceneDraft draft={{ ...draft, data: draft.data }} />;
  else return <PerformerDraft draft={{ ...draft, data: draft.data }} />;
};

export default DraftComponent;
