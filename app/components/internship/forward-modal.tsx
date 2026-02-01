import { useState } from "react";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { FiX, FiCopy } from "react-icons/fi";

interface ForwardModalProps {
  internshipId: string;
  applicationIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ForwardModal({
  internshipId,
  applicationIds,
  onClose,
  onSuccess,
}: ForwardModalProps) {
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [forwardedUrl, setForwardedUrl] = useState<string | null>(null);
  const [forwardedToken, setForwardedToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const response = await fetch("/api/internships/applications/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          application_ids: applicationIds,
          internship_id: internshipId,
          expires_at: expiresAt || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to forward applications");
      }

      const data = await response.json();
      setForwardedUrl(data.url);
      setForwardedToken(data.token);
      toast.success("Applications forwarded successfully");
    } catch (error: any) {
      console.error("Error forwarding applications:", error);
      toast.error(error.message || "Failed to forward applications");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (forwardedUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="relative w-full max-w-2xl rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-lg">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded p-2 text-gray-500 hover:bg-gray-100"
          >
            <FiX className="w-5 h-5" />
          </button>

          <h2 className="mb-4 font-['Clash_Display'] text-2xl font-bold text-neutral-900">
            Applications Forwarded
          </h2>

          <div className="mb-4 space-y-4">
            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Shareable URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={forwardedUrl}
                  readOnly
                  className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']"
                />
                <button
                  onClick={() => copyToClipboard(forwardedUrl)}
                  className="rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
                >
                  <FiCopy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Token (for reference)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={forwardedToken || ""}
                  readOnly
                  className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(forwardedToken || "")}
                  className="rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
                >
                  <FiCopy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onSuccess}
              className="flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-2 text-gray-500 hover:bg-gray-100"
        >
          <FiX className="w-5 h-5" />
        </button>

        <h2 className="mb-6 font-['Clash_Display'] text-2xl font-bold text-neutral-900">
          Forward to Company
        </h2>

        <p className="mb-4 font-['Satoshi'] text-gray-600">
          Forwarding {applicationIds.length} application{applicationIds.length !== 1 ? "s" : ""} to company.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
              Expiration Date (optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="mt-1 text-sm font-['Satoshi'] text-gray-500">
              Leave empty for no expiration
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Forwarding..." : "Forward Applications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

