import { useState } from "react";
import { TipTapEditor } from "../blog/tiptap-editor";

interface InternshipFormProps {
  initialData?: {
    id?: string;
    title?: string;
    company_name?: string;
    description?: string;
    requirements?: string;
    location?: string;
    duration?: string;
    stipend?: string;
    application_deadline?: string | null;
    status?: "draft" | "published" | "closed";
  };
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
}

export function InternshipForm({ initialData, onSubmit, onCancel }: InternshipFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [companyName, setCompanyName] = useState(initialData?.company_name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [requirements, setRequirements] = useState(initialData?.requirements || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [stipend, setStipend] = useState(initialData?.stipend || "");
  const [applicationDeadline, setApplicationDeadline] = useState(
    initialData?.application_deadline
      ? new Date(initialData.application_deadline).toISOString().split("T")[0]
      : ""
  );
  const [status, setStatus] = useState<"draft" | "published" | "closed">(
    initialData?.status || "draft"
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !companyName.trim() || !description.trim() || !requirements.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        company_name: companyName.trim(),
        description,
        requirements,
        location: location.trim() || undefined,
        duration: duration.trim() || undefined,
        stipend: stipend.trim() || undefined,
        application_deadline: applicationDeadline || undefined,
        status,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
          Role Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="e.g., Software Engineering Intern"
        />
      </div>

      <div>
        <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
          Company Name *
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
          className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="e.g., Tech Corp"
        />
      </div>

      <div>
        <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
          Description *
        </label>
        <TipTapEditor
          content={description}
          onChange={setDescription}
          placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
        />
      </div>

      <div>
        <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
          Requirements *
        </label>
        <TipTapEditor
          content={requirements}
          onChange={setRequirements}
          placeholder="List the skills, qualifications, and requirements for this internship..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g., Remote, Mumbai, India"
          />
        </div>

        <div>
          <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
            Duration
          </label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g., 3 months, 6 months"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
            Stipend
          </label>
          <input
            type="text"
            value={stipend}
            onChange={(e) => setStipend(e.target.value)}
            className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="e.g., ₹20,000/month, Unpaid"
          />
        </div>

        <div>
          <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
            Application Deadline
          </label>
          <input
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
          Status *
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "published" | "closed")}
          required
          className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : initialData ? "Update Internship" : "Create Internship"}
        </button>
      </div>
    </form>
  );
}

