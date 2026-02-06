import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import { FiPlus } from "react-icons/fi";
import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Companies – Maverick" },
    {
      name: "description",
      content: "Manage companies",
    },
  ];
}

interface Company {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Companies() {
  const { isAuthorized, isPending } = useOpsGuard();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isAuthorized) {
      loadCompanies();
    }
  }, [isAuthorized, search]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      const params = new URLSearchParams();
      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/companies?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load companies");
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  if (isPending || isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-['Satoshi'] text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
              Companies
            </h1>
            <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
              Manage company information
            </p>
          </div>
          <Link
            to="/companies/new"
            className="flex items-center gap-2 rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] font-bold text-white transition-colors hover:bg-violet-700"
          >
            <FiPlus className="h-5 w-5" />
            New Company
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full max-w-md rounded-lg border-2 border-neutral-900 px-4 py-2 font-['Satoshi'] focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {loading ? (
          <p className="font-['Satoshi'] text-gray-600">Loading companies...</p>
        ) : companies.length === 0 ? (
          <p className="font-['Satoshi'] text-gray-600">No companies found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-2 border-neutral-900">
              <thead>
                <tr className="bg-neutral-100">
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Name
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Email
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Phone
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Website
                  </th>
                  <th className="border-2 border-neutral-900 px-4 py-2 text-left font-['Satoshi'] font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {company.name}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {company.email || "—"}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {company.phone || "—"}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-600 hover:underline"
                        >
                          {company.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="border-2 border-neutral-900 px-4 py-2 font-['Satoshi']">
                      <Link
                        to={`/companies/${company.id}`}
                        className="text-violet-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

