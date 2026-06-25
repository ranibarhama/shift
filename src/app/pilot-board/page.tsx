import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import PilotBoardView from "@/components/PilotBoardView";
import { getCurrentRole } from "@/lib/session";
import {
  getAllPilotInitiatives,
  getAllPilotGaps,
} from "@/lib/pilotBoardDb";

export const metadata = {
  title: "Pilot Board · Shift",
};
export const dynamic = "force-dynamic";

export default async function PilotBoardPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");

  const [initiatives, gaps] = await Promise.all([
    getAllPilotInitiatives(),
    getAllPilotGaps(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <PilotBoardView initialInitiatives={initiatives} initialGaps={gaps} />
    </div>
  );
}
