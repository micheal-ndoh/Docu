import { LucideProps, Menu } from "lucide-react";

export const Icons = {
  Menu: (props: LucideProps) => <Menu {...props} />,
};

export function HamburgerMenu(props: LucideProps) {
  return <Icons.Menu {...props} />;
}
