import { useEffect, useState } from "react";
import { FiX, FiCopy, FiExternalLink } from "react-icons/fi";
import { toast } from "sonner";
import { getToken } from "~/lib/api";

interface BlastInternship {
  id: string;
  title: string;
  company_name: string;
  url: string;
}

interface WhatsAppBlastModalProps {
  onClose: () => void;
}

/**
 * Drafts one WhatsApp message covering every internship that is still open
 * (published, and not marked Closed in the pipeline tracker). The message is
 * editable before copying so ops can tweak the wording.
 */
export function WhatsAppBlastModal({ onClose }: WhatsAppBlastModalProps) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [internships, setInternships] = useState<BlastInternship[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const generate = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Not authenticated");
        }

        const response = await fetch("/api/internships/whatsapp-blast", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to draft the message");
        }
        if (cancelled) return;

        setMessage(data.message || "");
        setInternships(data.internships || []);
        setWarning(data.warning || null);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Error drafting WhatsApp blast:", err);
        setError(err.message || "Failed to draft the message");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    generate();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copied to clipboard!");
    } catch {
      toast.error("Could not copy. Select the text and copy manually.");
    }
  };

  const openInWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border-2 border-neutral-900 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(25,26,35,1)]">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg border-2 border-neutral-900 bg-white p-2 transition-colors hover:bg-gray-50"
        >
          <FiX className="h-5 w-5" />
        </button>

        <h2 className="mb-2 font-['Clash_Display'] text-2xl font-bold text-neutral-900">
          WhatsApp message
        </h2>
        <p className="mb-6 font-['Satoshi'] text-sm text-gray-600">
          {loading
            ? "Drafting a message for every internship that is still open..."
            : error
              ? "Something went wrong."
              : `${internships.length} active internship${
                  internships.length !== 1 ? "s" : ""
                } included. Closed ones are left out.`}
        </p>

        {loading ? (
          <p className="font-['Satoshi'] text-gray-600">Generating...</p>
        ) : error ? (
          <p className="font-['Satoshi'] text-red-600">{error}</p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
            {warning && (
              <p className="rounded-lg border-2 border-yellow-500 bg-yellow-50 px-4 py-2 font-['Satoshi'] text-sm text-neutral-900">
                {warning}
              </p>
            )}

            <div>
              <label className="mb-2 block font-['Satoshi'] font-medium text-neutral-900">
                Message (edit before sending if you like)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={16}
                className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <p className="mb-2 font-['Satoshi'] font-medium text-neutral-900">
                Links included
              </p>
              <ul className="space-y-1">
                {internships.map((internship) => (
                  <li key={internship.id} className="font-['Satoshi'] text-sm">
                    <span className="font-medium">
                      {internship.company_name}
                    </span>{" "}
                    <span className="text-gray-600">{internship.title}</span>
                    <br />
                    <a
                      href={internship.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline"
                    >
                      {internship.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
            >
              Close
            </button>
            <button
              onClick={openInWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-gray-50"
            >
              <FiExternalLink className="h-5 w-5" />
              Open in WhatsApp
            </button>
            <button
              onClick={copyToClipboard}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700"
            >
              <FiCopy className="h-5 w-5" />
              Copy message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
