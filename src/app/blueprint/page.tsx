import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import { getCurrentRole } from "@/lib/session";
import BlueprintView from "@/components/BlueprintView";
import { getIteration2Graph } from "@/lib/iteration2Db";

export const metadata = {
  title: "How good looks like · Shift",
};
export const dynamic = "force-dynamic";

export default async function HowGoodLooksLikePage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");
  const iteration2Graph = await getIteration2Graph();
  return (
    <div className="flex flex-1 flex-col">
      <Topbar />
      <BlueprintView iteration2Graph={iteration2Graph} />
    </div>
  );
}
