import Topbar from "@/components/Topbar";
import PilotResultsFrame from "@/components/PilotResultsFrame";
import { getCurrentTheme } from "@/lib/theme";

export const metadata = {
  title: "Pilot results · Shift",
};
export const dynamic = "force-dynamic";

// Public — anyone can view the pilot results without picking a role first.
export default async function PilotResultsPage() {
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
