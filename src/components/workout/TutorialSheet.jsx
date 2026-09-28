"use client";
import Sheet from "@/components/ui/Sheet";
import { FiPlayCircle, FiExternalLink } from "react-icons/fi";

/** Pulls the video id out of the common YouTube URL shapes so we can embed. */
function youtubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function TutorialSheet({ exercise, programInfo, onClose }) {
  const videoUrl = String(exercise?.video_url || "").trim();
  const cues = String(exercise?.cues || "").trim();
  const ytId = youtubeId(videoUrl);

  // Cues are authored in the Sheet; split so each point reads as its own line.
  const points = cues
    .split(/\r?\n|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Sheet
      subtitle={exercise?.muscle_group || "Tutorial"}
      title={exercise?.name || "Exercise"}
      onClose={onClose}
    >
      <div className="space-y-4 pb-4">
        {programInfo && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-ink bg-surface-raised rounded-lg px-2.5 py-1.5 tabular">
              {programInfo.target_sets} × {programInfo.target_reps}
            </span>
            {programInfo.target_weight > 0 && (
              <span className="text-xs font-medium text-ink bg-surface-raised rounded-lg px-2.5 py-1.5 tabular">
                Target {programInfo.target_weight} kg
              </span>
            )}
            {programInfo.rest_seconds > 0 && (
              <span className="text-xs font-medium text-ink bg-surface-raised rounded-lg px-2.5 py-1.5 tabular">
                Rest {programInfo.rest_seconds}s
              </span>
            )}
          </div>
        )}

        {ytId ? (
          <div className="rounded-xl overflow-hidden bg-ink aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}`}
              title={`Tutorial ${exercise?.name}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        ) : videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-md w-full"
          >
            <FiPlayCircle size={16} />
            Buka video
            <FiExternalLink size={13} className="text-ink-faint" />
          </a>
        ) : null}

        {points.length > 0 ? (
          <div>
            <p className="section-label mb-2">Jangan sampai salah</p>
            <ul className="space-y-2">
              {points.map((p, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-ink leading-relaxed">
                  <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-ink-faint" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            Belum ada catatan tekniknya buat gerakan ini.
          </p>
        )}

        {!videoUrl && (
          <p className="text-xs text-ink-faint">
            Belum ada video buat gerakan ini.
          </p>
        )}

        {exercise?.equipment && (
          <p className="text-xs text-ink-faint">Alat: {exercise.equipment}</p>
        )}
      </div>
    </Sheet>
  );
}
