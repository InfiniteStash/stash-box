import { faXmark } from "@fortawesome/free-solid-svg-icons";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Icon } from "src/components/fragments";
import { cn } from "src/lib/utils";

interface Message {
  id: number;
  content: React.ReactNode | string;
  variant?: "success" | "danger" | "warning";
}

const DISPLAY_TIME = 5000;
const ANIMATION_TIME = 1000;

const ToastContext = createContext<(item: Omit<Message, "id">) => void>(
  () => {},
);

const variantClasses: Record<NonNullable<Message["variant"]>, string> = {
  success: "bg-success",
  danger: "bg-destructive",
  warning: "bg-warning",
};

const ToastMessage: React.FC<Message> = ({ content, variant }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div
      className={cn(
        "mb-2 min-w-56 rounded-md text-white shadow-lg transition-opacity",
        variantClasses[variant ?? "success"],
      )}
    >
      <div className="flex justify-end p-3 pb-0">
        <button
          type="button"
          onClick={() => setShow(false)}
          className="cursor-pointer border-0 bg-transparent text-white/80 hover:text-white"
        >
          <Icon icon={faXmark} />
        </button>
      </div>
      <div className="px-3 pb-3">{content}</div>
    </div>
  );
};

interface ToastsProps {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
}

const Toasts: React.FC<ToastsProps> = ({ messages, setMessages }) => {
  const timer = React.useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (messages.length)
      timer.current = setTimeout(
        () => setMessages?.([]),
        DISPLAY_TIME + ANIMATION_TIME,
      );
  }, [messages, setMessages]);

  const toasts = messages.map((toast) => (
    <ToastMessage key={toast.id} {...toast} />
  ));

  return <div className="ToastContainer">{toasts}</div>;
};

interface Props {
  children?: React.ReactNode;
}

export const ToastProvider: React.FC<Props> = ({ children }) => {
  const id = React.useRef(0);
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (message: Omit<Message, "id">) => {
    setMessages([...messages, { ...message, id: id.current++ }]);
  };

  return (
    <ToastContext.Provider value={addMessage}>
      {children}
      <Toasts messages={messages} setMessages={setMessages} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const addToast = useContext(ToastContext);
  return addToast;
};
