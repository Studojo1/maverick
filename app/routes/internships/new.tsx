import { useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
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

export default function NewInternship() {
  const navigate = useNavigate();
  const { isAuthorized, isPending } = useOpsGuard();

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
      toast.success("Internship created successfully");
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
            Create a new internship listing
          </p>
        </div>

        <div className="rounded-lg border-2 border-neutral-900 bg-white p-8 overflow-hidden">
          <InternshipForm onSubmit={handleSubmit} onCancel={() => navigate("/internships")}           />
        </div>
      </div>
    </DashboardLayout>
  );
}

