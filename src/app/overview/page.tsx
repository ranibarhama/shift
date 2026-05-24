import Topbar from "@/components/Topbar";
import OverviewCanvas from "@/components/OverviewCanvas";
import { loadOverview } from "@/lib/overview";
import { getCurrentTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const data = loadOverview();
  const theme = await getCurrentTheme();
  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <OverviewCanvas data={data} initialTheme={theme} />
    </div>
  );
}
