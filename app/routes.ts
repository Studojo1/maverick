import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  route("blog/new", "routes/blog/new.tsx"),
  route("blog/:id", "routes/blog/$id.tsx"),
  route("api/auth/check-role", "routes/api.auth.check-role.tsx"),
  route("api/blog/upload-image", "routes/api/blog/upload-image.tsx"),
  route("api/blog/:id", "routes/api/blog/$id.tsx"),
  route("api/blog", "routes/api/blog/route.tsx"),
  route("api/images/*", "routes/api/images/$.tsx"),
  route("internships", "routes/internships/index.tsx"),
  route("internships/new", "routes/internships/new.tsx"),
  route("internships/:id", "routes/internships/$id.tsx"),
  route("internships/:id/applications", "routes/internships/$id/applications.tsx"),
  route("api/internships", "routes/api/internships/route.tsx"),
  route("api/internships/:id", "routes/api/internships/$id.tsx"),
  route("api/internships/:id/applications", "routes/api/internships/$id/applications.tsx"),
  route("api/internships/applications/:id", "routes/api/internships/applications/$id.tsx"),
  route("api/internships/applications/:id/download", "routes/api/internships/applications/$id/download.tsx"),
  route("api/internships/applications/:id/view", "routes/api/internships/applications/$id/view.tsx"),
] satisfies RouteConfig;

