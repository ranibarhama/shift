import { redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import NextStepsView from "@/components/NextStepsView";
import { getCurrentRole } from "@/lib/session";
import { getAllStoneBriefs } from "@/lib/stoneBriefsDb";

export const metadata = {
  title: "Next Steps · Shift",
};
export const dynamic = "force-dynamic";

export default async function NextStepsPage() {
  const role = await getCurrentRole();
  if (role !== "product") redirect("/");
  const briefs = await getAllStoneBriefs();

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <NextStepsView briefs={briefs} />
    </div>
  );
}
