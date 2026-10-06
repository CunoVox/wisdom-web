import * as Tooltip from "@radix-ui/react-tooltip";
import type { ReactElement } from "react";

export function Hint({ label, children }: { label: string; children: ReactElement }) {
  return <Tooltip.Provider delayDuration={250}><Tooltip.Root>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal><Tooltip.Content className="ui-tooltip" sideOffset={8}>{label}<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal>
  </Tooltip.Root></Tooltip.Provider>;
}
