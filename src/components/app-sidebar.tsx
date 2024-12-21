"use client";

import * as React from "react";
import { Bot, Settings2, SquareTerminal } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { title } from "process";
import Image from "next/image";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Orders",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "All Orders",
          url: "/administrator/orders",
        },
      ],
    },
    {
      title: "Menus",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "All Menus",
          url: "/administrator/products",
        },
        {
          title: "Add Menu",
          url: "/administrator/products/add",
        },
      ],
    },
    {
      title: "Categories",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "All Categories",
          url: "/administrator/categories",
        },
        {
          title: "Add Category",
          url: "/administrator/categories/add",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex justify-center items-center">
        <Image
          src="/logo.jpg"
          alt="Logo"
          width={80}
          height={80}
          className="relative"
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
