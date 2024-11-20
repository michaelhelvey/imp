import { GalleryVerticalEnd } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

import {
	Sidebar,
	SidebarContent,
	SidebarFiller,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail,
} from "@/components/ui/sidebar.js";
import { NavUser } from "./nav-user.js";

// Sample data: (todo: track active state etc)
const data = {
	navMain: [
		{
			title: "Incident Management",
			url: "#",
			items: [
				{
					title: "Incidents",
					url: "/",
					isActive: true,
				},
				{
					title: "Services",
					url: "/services",
				},
				{
					title: "Escalation Policies",
					url: "/escalation-policies",
				},
			],
		},
		{
			title: "Tenant Management",
			url: "#",
			items: [
				{
					title: "Users",
					url: "/users",
				},
				{
					title: "Teams",
					url: "/teams",
				},
				{
					title: "Roles",
					url: "/roles",
				},
			],
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const [_, setActiveItem] = useNavActiveItem();

	const onLinkClick =
		(family: string, item: string) =>
		(e: React.MouseEvent<HTMLAnchorElement>) => {
			setActiveItem({ family, item });
		};

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<a href="/">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
									<GalleryVerticalEnd className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="font-semibold">IMP</span>
								</div>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{data.navMain.map((family) => (
							<SidebarMenuItem key={family.title}>
								<SidebarMenuButton asChild>
									<a href={family.url} className="font-medium">
										{family.title}
									</a>
								</SidebarMenuButton>
								{family.items?.length ? (
									<SidebarMenuSub>
										{family.items.map((child) => (
											<SidebarMenuSubItem key={child.title}>
												<SidebarMenuSubButton asChild isActive={child.isActive}>
													<Link
														to={child.url}
														onClick={onLinkClick(family.title, child.title)}
													>
														{child.title}
													</Link>
												</SidebarMenuSubButton>
												{/* todo: add possible "onclick" attribute to handle things like logout that should be buttons */}
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								) : null}
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
				<SidebarFiller />
				<SidebarGroup>
					<NavUser
						user={{
							avatar:
								"https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.worldhistory.org%2Fimg%2Fc%2Fp%2F1200x627%2F13754.jpg&f=1&nofb=1&ipt=c3fb990ea2a0249fc6e58e5799bdfcc35a37cf3fa1482cceedd3562e63382380&ipo=images",
							email: "thomas.aquinas@email.com",
							name: "Thomas Aquinas",
						}}
					/>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}

interface IActiveItem {
	family: string;
	item: string;
}

interface INavStateContext {
	activeItem: IActiveItem;
	setActiveItem: (item: IActiveItem) => void;
}

const NavStateContext = React.createContext<INavStateContext>(
	null as unknown as any,
);

export function NavStateProvider({ children }: { children: React.ReactNode }) {
	const [activeItem, setActiveItem] = React.useState(activeItemFromCurrentUrl);

	return (
		<NavStateContext.Provider value={{ activeItem, setActiveItem }}>
			{children}
		</NavStateContext.Provider>
	);
}

export function useNavActiveItem() {
	const context = React.useContext(NavStateContext);
	return [context.activeItem, context.setActiveItem] as const;
}

function activeItemFromCurrentUrl(): IActiveItem {
	const url = new URL(window.location.href);

	switch (url.pathname) {
		case "/services":
			return { family: "Incident Management", item: "Services" };
		case "/escalation-policies":
			return { family: "Incident Management", item: "Escalation Policies" };
		case "/users":
			return { family: "Tenant Management", item: "Users" };
		case "/teams":
			return { family: "Tenant Management", item: "Teams" };
		case "/account/preferences":
			return { family: "Your Account", item: "Preferences" };
		case "/":
			return { family: "Incident Management", item: "Incidents" };
		default:
			throw new Error(
				`activeItemFromCurrentUrl: I don't know how to render ${url.pathname}`,
			);
	}
}
