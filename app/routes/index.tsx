import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useOpsGuard } from "~/lib/ops-guard";
import { getToken } from "~/lib/api";
import { toast } from "sonner";
import { DashboardLayout } from "~/components/dashboard/layout";
import type { Route } from "./+types/index";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Maverick – Ops Dashboard" },
    {
      name: "description",
      content: "Blog editor dashboard",
    },
  ];
}

interface BlogPostSummary {
  id: string;
  title: string;
  status: "draft" | "published";
  created_at: string;
  view_count: number;
}

interface InternshipSummary {
  id: string;
  title: string;
  company_name: string;
  status: string;
  created_at: string;
}

interface CompanySummary {
  id: string;
  name: string;
  email?: string;
}

export default function Dashboard() {
  const { isAuthorized, isPending } = useOpsGuard();
  const [loading, setLoading] = useState(true);
  const [blogStats, setBlogStats] = useState<{
    total: number;
    recent: BlogPostSummary[];
  }>({ total: 0, recent: [] });
  const [internshipStats, setInternshipStats] = useState<{
    total: number;
    recent: InternshipSummary[];
  }>({ total: 0, recent: [] });
  const [companyStats, setCompanyStats] = useState<{
    total: number;
    recent: CompanySummary[];
  }>({ total: 0, recent: [] });

  useEffect(() => {
    if (isAuthorized) {
      void loadDashboard();
    }
  }, [isAuthorized]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        toast.error("Not authenticated");
        return;
      }

      // Blog stats
      const blogParams = new URLSearchParams({
        page: "1",
        limit: "5",
      });

      const blogResponse = await fetch(`/api/blog?${blogParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!blogResponse.ok) {
        throw new Error("Failed to load blog stats");
      }
      const blogData = await blogResponse.json();
      setBlogStats({
        total: blogData.total || 0,
        recent: (blogData.posts || []).slice(0, 5),
      });

      // Internship stats
      const internshipParams = new URLSearchParams({
        page: "1",
        limit: "5",
      });
      const internshipResponse = await fetch(
        `/api/internships?${internshipParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!internshipResponse.ok) {
        throw new Error("Failed to load internship stats");
      }
      const internshipData = await internshipResponse.json();
      setInternshipStats({
        total: internshipData.total || 0,
        recent: (internshipData.internships || []).slice(0, 5),
      });

      // Company stats
      const companiesResponse = await fetch(`/api/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!companiesResponse.ok) {
        throw new Error("Failed to load company stats");
      }
      const companiesData = await companiesResponse.json();
      const companies: CompanySummary[] = companiesData.companies || [];
      setCompanyStats({
        total: companies.length,
        recent: companies.slice(0, 5),
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
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
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-['Clash_Display'] text-4xl font-bold text-neutral-900">
            Maverick Dashboard
          </h1>
          <p className="mt-2 font-['Satoshi'] text-sm text-gray-600">
            Overview of content, internships, and companies.
          </p>
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-sm">
            <p className="font-['Satoshi'] text-sm text-gray-600">Blog posts</p>
            <p className="mt-2 font-['Clash_Display'] text-3xl font-bold text-neutral-900">
              {blogStats.total}
            </p>
            <Link
              to="/blog"
              className="mt-4 inline-block font-['Satoshi'] text-sm text-violet-600 hover:underline"
            >
              View posts →
            </Link>
          </div>
          <div className="rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-sm">
            <p className="font-['Satoshi'] text-sm text-gray-600">
              Internships
            </p>
            <p className="mt-2 font-['Clash_Display'] text-3xl font-bold text-neutral-900">
              {internshipStats.total}
            </p>
            <Link
              to="/internships"
              className="mt-4 inline-block font-['Satoshi'] text-sm text-violet-600 hover:underline"
            >
              View internships →
            </Link>
          </div>
          <div className="rounded-lg border-2 border-neutral-900 bg-white p-6 shadow-sm">
            <p className="font-['Satoshi'] text-sm text-gray-600">Companies</p>
            <p className="mt-2 font-['Clash_Display'] text-3xl font-bold text-neutral-900">
              {companyStats.total}
            </p>
            <Link
              to="/companies"
              className="mt-4 inline-block font-['Satoshi'] text-sm text-violet-600 hover:underline"
            >
              View companies →
            </Link>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border-2 border-neutral-900 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-['Clash_Display'] text-xl font-bold text-neutral-900">
                Recent blog posts
              </h2>
              <Link
                to="/blog"
                className="font-['Satoshi'] text-xs text-violet-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <p className="font-['Satoshi'] text-sm text-gray-600">
                Loading posts...
              </p>
            ) : blogStats.recent.length === 0 ? (
              <p className="font-['Satoshi'] text-sm text-gray-600">
                No posts yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {blogStats.recent.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div>
                      <Link
                        to={`/blog/${post.id}`}
                        className="font-['Satoshi'] font-medium text-neutral-900 hover:text-violet-600"
                      >
                        {post.title}
                      </Link>
                      <p className="font-['Satoshi'] text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()} •{" "}
                        {post.view_count} views
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-['Satoshi'] font-medium ${
                        post.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {post.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border-2 border-neutral-900 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-['Clash_Display'] text-xl font-bold text-neutral-900">
                Recent internships
              </h2>
              <Link
                to="/internships"
                className="font-['Satoshi'] text-xs text-violet-600 hover:underline"
              >
                View all
              </Link>
            </div>
            {loading ? (
              <p className="font-['Satoshi'] text-sm text-gray-600">
                Loading internships...
              </p>
            ) : internshipStats.recent.length === 0 ? (
              <p className="font-['Satoshi'] text-sm text-gray-600">
                No internships yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {internshipStats.recent.map((internship) => (
                  <li
                    key={internship.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-['Satoshi'] font-medium text-neutral-900">
                        {internship.title}
                      </span>
                      <p className="font-['Satoshi'] text-xs text-gray-500">
                        {internship.company_name} •{" "}
                        {new Date(internship.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full px-3 py-1 text-xs font-['Satoshi'] font-medium bg-gray-100 text-gray-800">
                      {internship.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent companies */}
        <div className="mt-8 rounded-lg border-2 border-neutral-900 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-['Clash_Display'] text-xl font-bold text-neutral-900">
              Recent companies
            </h2>
            <Link
              to="/companies"
              className="font-['Satoshi'] text-xs text-violet-600 hover:underline"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <p className="font-['Satoshi'] text-sm text-gray-600">
              Loading companies...
            </p>
          ) : companyStats.recent.length === 0 ? (
            <p className="font-['Satoshi'] text-sm text-gray-600">
              No companies yet.
            </p>
          ) : (
            <ul className="divide-y-2 divide-neutral-900">
              {companyStats.recent.map((company) => (
                <li
                  key={company.id}
                  className="flex items-center justify-between gap-2 py-3"
                >
                  <div>
                    <span className="font-['Satoshi'] font-medium text-neutral-900">
                      {company.name}
                    </span>
                    {company.email && (
                      <p className="font-['Satoshi'] text-xs text-gray-500">
                        {company.email}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/companies/${company.id}`}
                    className="font-['Satoshi'] text-xs text-violet-600 hover:underline"
                  >
                    Manage →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

