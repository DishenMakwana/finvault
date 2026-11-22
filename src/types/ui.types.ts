import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
}

export interface CustomSelectProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  menuMaxHeight?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export interface SparkleStarProps {
  className?: string;
}

export type LoadingTheme =
  "teal" | "emerald" | "cyan" | "blue" | "indigo" | "purple" | "amber" | "rose";
export type LoadingSize = "sm" | "md" | "lg";

export interface PremiumLoadingProps {
  title?: string;
  subtitle?: string;
  theme?: LoadingTheme;
  size?: LoadingSize;
  fullScreen?: boolean;
  className?: string;
}
