import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import ProcessCanvas from "@/components/ProcessCanvas";
import { getCurrentRole } from "@/lib/session";
import { canEditMain } from "@/lib/roles";
import { getCurrentTheme } from "@/lib/theme";
import {
  getProcessByKey,
  getStagesForProcess,
  getEdgesForProcess,
  getItemsForStages,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MainProcessPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");

  const process = getProcessByKey("main");
  if (!process) throw new Error("Main process missing");
  const stages = getStagesForProcess(process.id);
  const edges = getEdgesForProcess(process.id);
  const items = getItemsForStages(stages.map((s) => s.id));
  const theme = await getCurrentTheme();

  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <ProcessCanvas
        processId={process.id}
        initial={{ process, stages, edges, items }}
        canEdit={canEditMain(role)}
        initialTheme={theme}
      />
    </div>
  );
}
