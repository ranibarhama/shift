import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import BigStonesView from "@/components/BigStonesView";
import { getCurrentRole } from "@/lib/session";
import { getAllMissingItems } from "@/lib/queries";
import { analyzeBacklog } from "@/lib/bigStones";

export const metadata = {
  title: "Backlog Zoom Out · Shift",
};
export const dynamic = "force-dynamic";

export default async function BigStonesPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");

  const items = await getAllMissingItems();
  const analysis = analyzeBacklog(items);

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <BigStonesView analysis={analysis} />
    </div>
  );
}
