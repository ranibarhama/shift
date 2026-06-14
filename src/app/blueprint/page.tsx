import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import { getCurrentRole } from "@/lib/session";
import BlueprintView from "@/components/BlueprintView";

export const metadata = {
  title: "How good looks like · Shift",
};

export default async function HowGoodLooksLikePage() {
  const role = await getCurrentRole();
  if (!role) redirect("/");
  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <BlueprintView />
    </div>
  );
}
