import { Link, useLocation } from "react-router";
import { FiBook, FiBriefcase, FiHome } from "react-icons/fi";
import { authClient } from "~/lib/auth-client";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { data: session } = authClient.useSession();

  const navigation = [
    { name: "Dashboard", href: "/", icon: FiHome },
    { name: "Blog", href: "/blog", icon: FiBook },
    { name: "Internships", href: "/internships", icon: FiBriefcase },
    { name: "Companies", href: "/companies", icon: FiBriefcase },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r-2 border-neutral-900">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-6 border-b-2 border-neutral-900">
            <h1 className="font-['Clash_Display'] text-2xl font-bold text-neutral-900">
              Maverick
            </h1>
            <p className="mt-1 font-['Satoshi'] text-sm text-gray-600">
              Ops Dashboard
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-['Satoshi'] font-medium transition-colors ${
                    active
                      ? "bg-violet-100 text-violet-700 border-2 border-violet-300"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t-2 border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="font-['Satoshi'] font-bold text-violet-700">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Satoshi'] font-medium text-neutral-900 truncate">
                  {session?.user?.name || "User"}
                </p>
                <p className="font-['Satoshi'] text-xs text-gray-600 truncate">
                  {session?.user?.email || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

