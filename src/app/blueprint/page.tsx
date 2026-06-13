import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/session";
import BlueprintView from "@/components/BlueprintView";

export const metadata = {
  title: "How good looks like · Shift",
};

export default async function HowGoodLooksLikePage() {
  const role = await getCurrentRole();
  if (role !== "product") redirect("/");
  return <BlueprintView />;
}
