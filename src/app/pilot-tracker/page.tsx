import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import PilotTrackerView from "@/components/PilotTrackerView";
import { getCurrentRole } from "@/lib/session";
import {
  getAllPilotInitiatives,
  getAllPilotGaps,
  getAllPilotTasks,
} from "@/lib/pilotBoardDb";

export const metadata = {
  title: "Pilot Tracker · Shift",
};
export const dynamic = "force-dynamic";

export default async function PilotTrackerPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");

  const [initiatives, gaps, tasks] = await Promise.all([
    getAllPilotInitiatives(),
    getAllPilotGaps(),
    getAllPilotTasks(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <Topbar />
      <PilotTrackerView
        initialInitiatives={initiatives}
        initialGaps={gaps}
        initialTasks={tasks}
      />
    </div>
  );
}
