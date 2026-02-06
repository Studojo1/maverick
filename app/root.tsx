import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { Toaster } from "sonner";
import "./app.css";

import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.png", type: "image/png" },
  { rel: "preconnect", href: "https://api.fontshare.com" },
  {
    rel: "stylesheet",
    href: "https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=satoshi@400,500,700,900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-gray-50">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: "font-['Satoshi']",
              title: "font-['Satoshi'] font-medium",
              description: "font-['Satoshi']",
              success: "bg-emerald-50 border-emerald-200 text-emerald-900",
              error: "bg-red-50 border-red-200 text-red-900",
              info: "bg-blue-50 border-blue-200 text-blue-900",
            },
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status: number | undefined;
  let title = "Something went wrong";
  let description = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    status = error.status;
  }

  if (status === 401) {
    title = "You need to sign in";
    description =
      "To access this page in Maverick, sign in to the main Studojo app as an ops/admin user, then refresh this page.";
  } else if (status === 403) {
    title = "You don’t have access";
    description =
      "Your account doesn’t have permission to view this page. Ask an ops or admin user to grant access.";
  } else if (status === 404) {
    title = "Page not found";
    description = "The resource you’re looking for doesn’t exist or may have been moved.";
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="mx-auto max-w-lg rounded-2xl border-2 border-neutral-900 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
        {status && (
          <p className="mb-2 font-['Satoshi'] text-xs font-semibold uppercase tracking-wide text-gray-500">
            {status === 401 && "Unauthorized"}
            {status === 403 && "Forbidden"}
            {status === 404 && "Not found"}
            {!status && "Error"}
          </p>
        )}
        <h1 className="font-['Clash_Display'] text-3xl font-bold text-neutral-900">
          {title}
        </h1>
        <p className="mt-3 font-['Satoshi'] text-sm text-gray-600">{description}</p>

        {status === 401 && (
          <div className="mt-6 space-y-2 font-['Satoshi'] text-xs text-gray-600">
            <p>Make sure you’re:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Logged into the main Studojo app in this browser.</li>
              <li>Using an account with the ops or admin role.</li>
            </ul>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="flex-1 rounded-lg border-2 border-neutral-900 bg-violet-600 px-4 py-2 font-['Satoshi'] text-sm font-semibold text-white hover:bg-violet-700"
          >
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 rounded-lg border-2 border-neutral-900 bg-white px-4 py-2 font-['Satoshi'] text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}

