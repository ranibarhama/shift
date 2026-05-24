import {
  listProcesses,
  getStagesForProcess,
  getEdgesForProcess,
  getItemsForStages,
} from "./queries";
import type { EdgeRow, ItemRow, ProcessRow, StageRow } from "./queries";

export type OverviewData = {
  processes: ProcessRow[];
  stagesByProcess: Record<string, StageRow[]>;
  edgesByProcess: Record<string, EdgeRow[]>;
  itemsByStage: Record<string, ItemRow[]>;
};

export async function loadOverview(): Promise<OverviewData> {
  const processes = await listProcesses();
  const stagesByProcess: Record<string, StageRow[]> = {};
  const edgesByProcess: Record<string, EdgeRow[]> = {};
  const allStageIds: string[] = [];

  for (const p of processes) {
    const s = await getStagesForProcess(p.id);
    stagesByProcess[p.id] = s;
    edgesByProcess[p.id] = await getEdgesForProcess(p.id);
    allStageIds.push(...s.map((x) => x.id));
  }

  const items = await getItemsForStages(allStageIds);
  const itemsByStage: Record<string, ItemRow[]> = {};
  for (const it of items) {
    if (!itemsByStage[it.stage_id]) itemsByStage[it.stage_id] = [];
    itemsByStage[it.stage_id].push(it);
  }
  return { processes, stagesByProcess, edgesByProcess, itemsByStage };
}
