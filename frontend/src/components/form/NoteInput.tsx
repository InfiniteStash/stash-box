import { type ChangeEvent, type FC, useState } from "react";
import type { UseFormRegister } from "react-hook-form";
import EditComment from "src/components/editCard/EditComment";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "src/components/ui/tabs";
import { Textarea } from "src/components/ui/textarea";
import { useCurrentUser } from "src/hooks";

interface IProps {
  onChange?: (text: string) => void;
  className?: string;
  register?: UseFormRegister<{ note: string }>;
  hasError?: boolean;
  initialValue?: string;
}

const NoteInput: FC<IProps> = ({
  onChange,
  className,
  register,
  hasError = false,
  initialValue = "",
}) => {
  const { user } = useCurrentUser();
  const [comment, setComment] = useState(initialValue);
  const [tab, setTab] = useState("write");

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.currentTarget.value);
    onChange?.(e.currentTarget.value);
  };

  const textareaProps = register ? register("note") : { name: "note" };
  const now = new Date().toISOString();

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          className={className}
          onInput={handleChange}
          rows={5}
          defaultValue={initialValue}
          aria-invalid={hasError}
          {...textareaProps}
        />
      </TabsContent>
      <TabsContent value="preview">
        <EditComment
          id={`${user?.id}-${now}`}
          comment={comment}
          date={now}
          user={user}
          preview
        />
      </TabsContent>
    </Tabs>
  );
};

export default NoteInput;
