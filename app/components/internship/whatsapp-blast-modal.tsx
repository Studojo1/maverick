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

/** Key for the combined weekly blast, alongside the per internship ids. */
const ALL = "all";

/**
 * WhatsApp messages for the internships that are still open.
 *
 * Two kinds of message, picked with the buttons at the top:
 *  - "All internships": the weekly blast listing every open role (built by
 *    /api/internships/whatsapp-blast).
 *  - One button per open internship: that internship's own message, from
 *    /api/internships/:id/whatsapp, the same endpoint the internship detail
 *    page uses, so the wording matches exactly.
 *
 * Messages are fetched once per internship and then cached for the life of
 * the modal, so switching back and forth is instant and does not re-bill the
 * model. Edits are kept per message.
 */
export function WhatsAppBlastModal({ onClose }: WhatsAppBlastModalProps) {
  const [internships, setInternships] = useState<BlastInternship[]>([]);
  const [activeId, setActiveId] = useState<string>(ALL);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(ALL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);

  // Load the combined blast (and with it, the list of open internships).
  useEffect(() => {
    let cancelled = false;

    const loadBlast = async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Not authenticated");

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

        setMessages((prev) => ({ ...prev, [ALL]: data.message || "" }));
        setInternships(data.internships || []);
        setWarning(data.warning || null);
      } catch (err: any) {
        if (cancelled) return;
        console.error("Error drafting WhatsApp blast:", err);
        setErrors((prev) => ({
          ...prev,
          [ALL]: err.message || "Failed to draft the message",
        }));
      } finally {
        if (!cancelled) setLoadingId(null);
      }
    };

    loadBlast();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Fetch one internship's own message, unless it is already cached. */
  const selectInternship = async (id: string) => {
    setActiveId(id);
    if (id === ALL || messages[id] !== undefined) return;

    setLoadingId(id);
    setErrors((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/internships/${id}/whatsapp`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate the message");
      }

      setMessages((prev) => ({ ...prev, [id]: data.message || "" }));
    } catch (err: any) {
      console.error("Error generating WhatsApp message:", err);
      setErrors((prev) => ({
        ...prev,
        [id]: err.message || "Failed to generate the message",
      }));
    } finally {
      setLoadingId((current) => (current === id ? null : current));
    }
  };

  const activeMessage = messages[activeId] ?? "";
  const activeError = errors[activeId];
  const isLoading = loadingId === activeId;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(activeMessage);
      toast.success("Message copied to clipboard!");
    } catch {
      toast.error("Could not copy. Select the text and copy manually.");
    }
  };

  const openInWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(activeMessage)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const tabClass = (id: string) =>
    `rounded-lg border-2 border-neutral-900 px-3 py-1.5 text-left font-['Satoshi'] text-sm transition-colors ${
      activeId === id
        ? "bg-violet-600 font-bold text-white"
        : "bg-white text-neutral-900 hover:bg-neutral-100"
    }`;

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
        <p className="mb-4 font-['Satoshi'] text-sm text-gray-600">
          {internships.length > 0
            ? `${internships.length} internship${
                internships.length !== 1 ? "s" : ""
              } still open. Pick one for its own message, or send them all together.`
            : "Drafting messages for every internship that is still open..."}
        </p>

        {internships.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button onClick={() => setActiveId(ALL)} className={tabClass(ALL)}>
              All internships
            </button>
            {internships.map((internship) => (
              <button
                key={internship.id}
                onClick={() => selectInternship(internship.id)}
                className={tabClass(internship.id)}
              >
                <span className="font-medium">{internship.company_name}</span>
                <span
                  className={
                    activeId === internship.id
                      ? "text-violet-100"
                      : "text-gray-600"
                  }
                >
                  {" "}
                  {internship.title}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {warning && activeId === ALL && (
            <p className="rounded-lg border-2 border-yellow-500 bg-yellow-50 px-4 py-2 font-['Satoshi'] text-sm text-neutral-900">
              {warning}
            </p>
          )}

          {isLoading ? (
            <p className="font-['Satoshi'] text-gray-600">Generating...</p>
          ) : activeError ? (
            <p className="font-['Satoshi'] text-red-600">{activeError}</p>
          ) : (
            <textarea
              value={activeMessage}
              onChange={(e) =>
                setMessages((prev) => ({ ...prev, [activeId]: e.target.value }))
              }
              rows={18}
              className="w-full rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border-2 border-neutral-900 px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Close
          </button>
          <button
            onClick={openInWhatsApp}
            disabled={!activeMessage}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 bg-white px-6 py-3 font-['Satoshi'] font-medium text-neutral-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiExternalLink className="h-5 w-5" />
            Open in WhatsApp
          </button>
          <button
            onClick={copyToClipboard}
            disabled={!activeMessage}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-neutral-900 bg-violet-600 px-6 py-3 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiCopy className="h-5 w-5" />
            Copy message
          </button>
        </div>
      </div>
    </div>
  );
}
