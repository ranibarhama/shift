import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import BacklogTabs from "@/components/BacklogTabs";
import { getCurrentRole } from "@/lib/session";
import { getAllMissingItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");

  const items = await getAllMissingItems();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <BacklogTabs items={items} />
    </div>
  );
}
