import { Outlet } from "react-router";
import { TabBar } from "~/components/TabBar";

export default function TabLayout() {
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}
