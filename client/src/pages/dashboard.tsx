import {
	AppSidebar,
	NavStateProvider,
	useNavActiveItem,
} from "@/components/app-sidebar.js";
import { ModeToggle } from "@/components/mode-toggle.js";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.js";
import { Separator } from "@/components/ui/separator.js";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar.js";
import { Outlet } from "react-router-dom";

export default function Page() {
	return (
		<NavStateProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					<header className="flex h-16 shrink-0 items-center gap-2 border-b">
						<div className="flex w-full justify-between px-3">
							<div className="flex items-center gap-2">
								<SidebarTrigger />
								<Separator orientation="vertical" className="mr-2 h-4" />
								<StatefulBreadCrumbs />
							</div>
							<ModeToggle />
						</div>
					</header>
					<div className="flex flex-1 flex-col gap-4 p-4">
						<Outlet />
					</div>
				</SidebarInset>
			</SidebarProvider>
		</NavStateProvider>
	);
}

function StatefulBreadCrumbs() {
	const [activeItem] = useNavActiveItem();
	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem className="hidden md:block">
					<BreadcrumbLink href="#">{activeItem.family}</BreadcrumbLink>
				</BreadcrumbItem>
				<BreadcrumbSeparator className="hidden md:block" />
				<BreadcrumbItem>
					<BreadcrumbPage>{activeItem.item}</BreadcrumbPage>
				</BreadcrumbItem>
			</BreadcrumbList>
		</Breadcrumb>
	);
}
