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
] satisfies RouteConfig;

