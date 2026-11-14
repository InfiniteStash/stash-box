import type React from "react";
import { Card, CardBody, CardHeader } from "src/components/ui/card";

interface Props {
  heading: string;
  children: React.ReactNode;
}

const CLASSNAME = "EditorCard";

const EditorCard: React.FC<Props> = ({ heading, children }) => (
  <Card className={CLASSNAME}>
    <CardHeader className="pb-0 text-sm font-semibold">{heading}</CardHeader>
    <CardBody>{children}</CardBody>
  </Card>
);

export default EditorCard;
