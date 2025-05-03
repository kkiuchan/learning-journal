import {
  Bell,
  Book,
  BarChart as Chart,
  Check,
  MessageSquare as Discord,
  Folder,
  Github,
  type LucideIcon,
  type LucideProps,
  PenLine as Pencil,
  Users,
  X,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  logo: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  x: X,
  github: Github,
  discord: Discord,
  book: Book,
  pencil: Pencil,
  chart: Chart,
  users: Users,
  bell: Bell,
  folder: Folder,
  check: Check,
};
