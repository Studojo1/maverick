import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FiUploadCloud, FiClipboard, FiEdit3 } from "react-icons/fi";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { celebrate } from "~/lib/confetti";
import { toast } from "sonner";
import { InternshipForm } from "~/components/internship/internship-form";
import { DashboardLayout } from "~/components/dashboard/layout";
import type { Route } from "./+types/new";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Internship – Maverick" },
    {
      name: "description",
      content: "Create a new internship listing",
    },
  ];
}

type Stage = "choose" | "form";

// Persist the in-progress draft so a refresh before publishing doesn't lose
// the (paid) AI generation or the reviewer's place in the flow.
const DRAFT_KEY = "maverick:new-internship-draft";

export default function NewInternship() {
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();

  const [stage, setStage] = useState<Stage>("choose");
  const [pasteText, setPasteText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [initialData, setInitialData] = useState<any | undefined>(undefined);
  const [restored, setRestored] = useState(false);

  // Restore any saved draft on mount (client-only).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.pasteText === "string") setPasteText(saved.pasteText);
        if (saved.stage === "form" && saved.initialData) {
          setInitialData(saved.initialData);
          setStage("form");
        }
      }
    } catch {
      // Ignore malformed/unavailable storage
    } finally {
      setRestored(true);
    }
  }, []);

  // Persist the choose-stage paste text (form-stage edits are persisted via
  // the form's onDraftChange below).
  useEffect(() => {
    if (!restored || stage !== "choose") return;
    try {
      if (pasteText.trim()) {
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ stage: "choose", pasteText, initialData: null })
        );
      } else {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // Ignore storage failures (e.g. private mode quota)
    }
  }, [restored, stage, pasteText]);

  // Persist the latest edited form values so a refresh keeps the user's edits,
  // not just the generated baseline.
  const handleDraftChange = (data: any) => {
    if (!restored) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ stage: "form", pasteText, initialData: data })
      );
    } catch {
      // Ignore storage failures
    }
  };

  const clearDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignore
    }
  };

  const handleGenerate = async () => {
    if (pasteText.trim().length < 20) {
      toast.error("Paste a longer job description to generate from.");
      return;
    }

    setGenerating(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/internships/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: pasteText }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate opening");
      }

      setInitialData({ ...result.opening });
      setStage("form");
      toast.success("Draft generated. Review and edit before publishing.");
    } catch (error: any) {
      console.error("Error generating opening:", error);
      toast.error(error.message || "Failed to generate opening");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/internships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create internship");
      }

      const result = await response.json();
      clearDraft();
      toast.success("Internship created successfully");
      celebrate();
      navigate(`/internships/${result.internship.id}`);
    } catch (error: any) {
      console.error("Error creating internship:", error);
      toast.error(error.message || "Failed to create internship");
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent"></div>
          <p className="font-['Satoshi'] text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            New Internship
          </h1>
          <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
            {stage === "choose"
              ? "Generate a draft from a job description, or fill it in manually."
              : "Review the details, edit anything, then publish."}
          </p>
        </div>

        {stage === "choose" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Upload a file - coming soon */}
              <div className="relative cursor-not-allowed rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 opacity-70">
                <span className="absolute right-3 top-3 rounded-full border-2 border-neutral-900 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-700">
                  Coming soon
                </span>
                <FiUploadCloud className="mb-3 h-8 w-8 text-neutral-400" />
                <h3 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                  Upload a file
                </h3>
                <p className="mt-1 font-['Satoshi'] text-sm text-gray-600">
                  PDF or DOCX. File parsing is coming soon. For now, paste the
                  text instead.
                </p>
              </div>

              {/* Paste text - active */}
              <div className="rounded-2xl border-2 border-neutral-900 bg-violet-50 p-6 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
                <FiClipboard className="mb-3 h-8 w-8 text-violet-600" />
                <h3 className="font-['Clash_Display'] text-lg font-bold text-neutral-900">
                  Paste a description
                </h3>
                <p className="mt-1 font-['Satoshi'] text-sm text-gray-600">
                  Paste the raw job description and let AI structure the opening
                  for you.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-neutral-900 bg-white p-6">
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Job description
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={12}
                placeholder="Paste the raw internship/job description here..."
                className="w-full rounded-lg border-2 border-neutral-900 px-4 py-3 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white shadow-[4px_4px_0px_0px_rgba(25,26,35,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(25,26,35,1)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Opening"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInitialData(undefined);
                    setStage("form");
                  }}
                  className="inline-flex items-center gap-2 font-['Satoshi'] font-medium text-violet-600 hover:underline"
                >
                  <FiEdit3 className="h-4 w-4" />
                  Fill in manually instead
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden">
            <InternshipForm
              key={initialData ? "generated" : "manual"}
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={() => setStage("choose")}
              onDraftChange={handleDraftChange}
              submitLabel="Create Internship"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
