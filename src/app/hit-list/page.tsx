import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import HitListTable from "@/components/HitListTable";
import { getCurrentRole } from "@/lib/session";
import { getAllDropItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HitListPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");

  const rows = await getAllDropItems();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <HitListTable rows={rows} />
    </div>
  );
}
