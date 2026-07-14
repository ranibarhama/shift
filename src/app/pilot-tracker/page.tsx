import Topbar from "@/components/Topbar";
import PilotTrackerView from "@/components/PilotTrackerView";
import {
  getAllPilotInitiatives,
  getAllPilotGaps,
  getAllPilotTasks,
} from "@/lib/pilotBoardDb";

export const metadata = {
  title: "Pilot Tracker · Shift",
};
export const dynamic = "force-dynamic";

// Public page: anyone with the link can view and edit — no sign-in gate.
export default async function PilotTrackerPage() {
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
