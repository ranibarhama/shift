import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import PilotResultsFrame from "@/components/PilotResultsFrame";
import { getCurrentRole } from "@/lib/session";
import { getCurrentTheme } from "@/lib/theme";

export const metadata = {
  title: "Pilot results · Shift",
};
export const dynamic = "force-dynamic";

export default async function PilotResultsPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");
  const theme = await getCurrentTheme();
  return (
    <div className="flex flex-1 flex-col">
      <Topbar />
      <PilotResultsFrame
        src={`/shift-pilot-dashboard-standalone.html?theme=${theme}`}
      />
    </div>
  );
}
