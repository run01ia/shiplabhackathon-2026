import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  route("shopping", "routes/shopping.tsx"),
  layout("routes/tab-layout.tsx", [
    route("home", "routes/home.tsx"),
    route("lists", "routes/lists.tsx"),
    route("history", "routes/history.tsx"),
    route("stores", "routes/stores.tsx"),
  ]),
] satisfies RouteConfig;
