import { ReactNode } from "react";

export default function SectionTitle({children}: {children: ReactNode}) {
  return <h2 className="font-intro text-2xl font-extrabold sm:text-3xl text-brand">{children}</h2>;
}
