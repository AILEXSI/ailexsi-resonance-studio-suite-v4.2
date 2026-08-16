/**
 * Régisseur-style arrangement: propose cuts from existing project videos.
 * Never writes the timeline — caller must Accept / Reject.
 */
import type { Clip, Project, ProjectEditProposal } from "./models";
import { collectBeatTimesMs } from "./ai-visualizer";

function uid(): string {
  return crypto.randomUUID();
}

export function proposeArrangement(project: Project): ProjectEditProposal {
  const now = new Date().toISOString();
  const arr = project.tracks.find((t) => t.role === "ai-arrangement");
  if (!arr) {
    return {
      id: uid(),
      createdAt: now,
      source: "rule",
      naturalLanguage: "Arrange existing videos to the music",
      rationale: "No AI Arrangement track in this project.",
      operations: [],
      status: "pending",
      previewDiff: "(no change)",
    };
  }

  const sources = project.tracks
    .filter((t) => t.kind === "VIDEO" && t.role !== "ai-visualizer" && t.role !== "ai-arrangement")
    .flatMap((t) => t.clips)
    .filter((c) => c.mediaAssetId);

  if (!sources.length) {
    return {
      id: uid(),
      createdAt: now,
      source: "rule",
      naturalLanguage: "Arrange existing videos to the music",
      rationale:
        "No user video clips found on V1/V2. Import and place videos first, then propose again. Nothing will be written until you Accept.",
      operations: [],
      status: "pending",
      previewDiff: "(no change)",
    };
  }

  const duration = Math.max(project.durationMs, ...sources.map((c) => c.range.endMs));
  const beats = collectBeatTimesMs({ ...project, durationMs: duration });
  const cuts = [0, ...beats.filter((b) => b > 80 && b < duration - 80), duration];
  const uniqueCuts = [...new Set(cuts)].sort((a, b) => a - b);

  const clips: Clip[] = [];
  for (let i = 0; i < uniqueCuts.length - 1; i++) {
    const startMs = uniqueCuts[i]!;
    const endMs = uniqueCuts[i + 1]!;
    if (endMs - startMs < 80) continue;
    const src = sources[i % sources.length]!;
    const srcIn = src.sourceRange?.startMs ?? 0;
    const srcDur = (src.sourceRange?.endMs ?? srcIn + (src.range.endMs - src.range.startMs)) - srcIn;
    const take = Math.min(endMs - startMs, Math.max(200, srcDur));
    clips.push({
      id: uid(),
      trackId: arr.id,
      mediaAssetId: src.mediaAssetId,
      range: { startMs, endMs: startMs + take },
      sourceRange: { startMs: srcIn, endMs: srcIn + take },
      label: `${src.label || "clip"} · AI cut`,
      metadata: { fromClipId: src.id, role: "ai-arrangement" },
    });
  }

  return {
    id: uid(),
    createdAt: now,
    source: "rule",
    naturalLanguage: "Arrange existing videos to the music",
    rationale: `Régisseur: ${clips.length} beat-aligned cuts from ${sources.length} source clip(s) onto AI Arrangement. Accept to place them. Reject leaves V1/V2 untouched.`,
    operations: [
      {
        op: "replace_track_clips",
        targetId: arr.id,
        payload: { clips },
      },
    ],
    status: "pending",
    previewDiff: `AI Arrangement ← ${clips.length} clips (cut-to-beat)`,
  };
}
