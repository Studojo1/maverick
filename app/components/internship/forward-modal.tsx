import { useState } from "react";
import { FiX, FiCopy } from "react-icons/fi";
import { toast } from "sonner";
import { getToken } from "~/lib/api";

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
  const [partnerPanelUrl, setPartnerPanelUrl] = useState<string | null>(null);

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
      setPartnerPanelUrl(data.partner_panel_url);
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
        <div className="relative w-full max-w-2xl rounded-lg border-2 border-neutral-900 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg border-2 border-neutral-900 bg-white p-2 transition-colors hover:bg-gray-50"
          >
            <FiX className="h-5 w-5" />
          </button>

          <h2 className="mb-4 font-['Clash_Display'] text-2xl font-bold text-neutral-900">
            Applications Forwarded Successfully
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Token URL (Legacy)
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
                  className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] font-medium transition-colors hover:bg-gray-50"
                >
                  <FiCopy className="h-5 w-5" />
                </button>
              </div>
            </div>

            {partnerPanelUrl && (
              <div>
                <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                  Partner Panel URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={partnerPanelUrl}
                    readOnly
                    className="flex-1 rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi']"
                  />
                  <button
                    onClick={() => copyToClipboard(partnerPanelUrl)}
                    className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] font-medium transition-colors hover:bg-gray-50"
                  >
                    <FiCopy className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Token
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
                  className="rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] font-medium transition-colors hover:bg-gray-50"
                >
                  <FiCopy className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
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
      <div className="relative w-full max-w-md rounded-lg border-2 border-neutral-900 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border-2 border-neutral-900 bg-white p-2 transition-colors hover:bg-gray-50"
        >
          <FiX className="h-5 w-5" />
        </button>

        <h2 className="mb-4 font-['Clash_Display'] text-2xl font-bold text-neutral-900">
          Forward Applications
        </h2>

        <p className="mb-6 font-['Satoshi'] text-sm text-gray-600">
          Forward {applicationIds.length} application{applicationIds.length !== 1 ? "s" : ""} to the partner panel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
              Expiration Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
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
              {loading ? "Forwarding..." : "Forward"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

