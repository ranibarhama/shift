import { notFound, redirect } from "next/navigation";
import Topbar from "@/components/Topbar";
import ProcessCanvas from "@/components/ProcessCanvas";
import WorkflowSidebar from "@/components/WorkflowSidebar";
import { getCurrentRole } from "@/lib/session";
import { ROLES, ROLE_COLOR_HEX, canEditDepartment, type RoleKey } from "@/lib/roles";
import {
  getProcessesForRole,
  getProcessById,
  getStagesForProcess,
  getEdgesForProcess,
  getItemsForStages,
  getCommentsForStages,
  listParticipants,
  getStageParticipants,
  getMainStages,
} from "@/lib/queries";
import { getCurrentTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function DepartmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ w?: string }>;
}) {
  const { role: deptParam } = await params;
  const sp = await searchParams;
  const currentRole = await getCurrentRole();
  if (!currentRole) redirect("/");

  const deptRoleDef = ROLES.find((r) => r.key === deptParam && r.key !== "gm");
  if (!deptRoleDef) notFound();
  const deptRole = deptRoleDef.key as RoleKey;

  const workflows = await getProcessesForRole(deptRole);
  const canEdit = canEditDepartment(currentRole, deptRole);
  const theme = await getCurrentTheme();
  const mainStagesRaw = await getMainStages();
  const mainStages = mainStagesRaw.map((s) => ({ id: s.id, name: s.name }));

  const selectedId =
    sp.w && workflows.find((w) => w.id === sp.w)
      ? sp.w
      : workflows[0]?.id ?? null;
  const selected = selectedId ? await getProcessById(selectedId) : null;
  const stages = selected ? await getStagesForProcess(selected.id) : [];
  const edges = selected ? await getEdgesForProcess(selected.id) : [];
  const items = selected ? await getItemsForStages(stages.map((s) => s.id)) : [];
  const comments = selected ? await getCommentsForStages(stages.map((s) => s.id)) : [];
  const participants = await listParticipants();
  const stageParticipants = selected ? await getStageParticipants(stages.map((s) => s.id)) : [];

  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar
          role={deptRole}
          workflows={workflows.map((w) => ({ id: w.id, name: w.name }))}
          selectedId={selectedId}
          canEdit={canEdit}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {selected ? (
            <ProcessCanvas
              key={selected.id}
              processId={selected.id}
              initial={{
                process: selected,
                stages,
                edges,
                items,
                comments,
                participants,
                stageParticipants,
              }}
              canEdit={canEdit}
              mainStages={mainStages}
              initialTheme={theme}
            />
          ) : (
            <EmptyState role={deptRole} canEdit={canEdit} />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ role, canEdit }: { role: RoleKey; canEdit: boolean }) {
  const accent = ROLE_COLOR_HEX[role];
  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-line bg-card/80 p-8 text-center">
        <div
          className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full text-xl font-semibold"
          style={{ background: `${accent}22`, color: accent }}
        >
          +
        </div>
        <h2 className="text-lg font-semibold text-fg">No workflows yet</h2>
        <p className="mt-1 text-sm text-muted">
          {canEdit
            ? "Use the “+ Add workflow” button in the left sidebar to map your first workflow."
            : "Nothing has been mapped here yet."}
        </p>
      </div>
    </div>
  );
}
