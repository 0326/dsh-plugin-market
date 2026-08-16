function SkeletonLine({ className = "" }: { className?: string }) {
	return <span className={"skeleton block h-3 " + className} aria-hidden="true" />;
}

export function PluginGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading plugins">
			{Array.from({ length: count }, (_, index) => (
				<div key={index} className="card border-2 border-base-300 bg-base-100">
					<div className="card-body gap-4">
						<div className="flex items-center gap-3">
							<span className="skeleton h-12 w-12 shrink-0" aria-hidden="true" />
							<div className="flex-1 space-y-2">
								<SkeletonLine className="w-2/3" />
								<SkeletonLine className="w-1/3" />
							</div>
						</div>
						<SkeletonLine className="w-full" />
						<SkeletonLine className="w-4/5" />
						<div className="mt-2 flex gap-2"><SkeletonLine className="w-16" /><SkeletonLine className="w-20" /></div>
					</div>
				</div>
			))}
		</div>
	);
}

export function PluginDetailSkeleton() {
	return (
		<section className="mx-auto max-w-5xl" role="status" aria-label="Loading plugin details">
			<div className="mb-6 border-b border-base-300 pb-6">
				<span className="skeleton mb-6 block aspect-[2/1] w-full" aria-hidden="true" />
				<SkeletonLine className="mb-4 h-10 w-2/3" />
				<SkeletonLine className="mb-3 w-full" />
				<SkeletonLine className="mb-5 w-1/4" />
				<div className="flex gap-2"><SkeletonLine className="h-6 w-24" /><SkeletonLine className="h-6 w-28" /><SkeletonLine className="h-6 w-20" /></div>
			</div>
			<div className="mb-6 border-2 border-base-300 p-5">
				<SkeletonLine className="mb-4 h-5 w-24" />
				<SkeletonLine className="h-12 w-full" />
			</div>
			<div className="mb-8 flex gap-5 border-b border-base-300 pb-3">
				<SkeletonLine className="w-20" /><SkeletonLine className="w-24" /><SkeletonLine className="w-20" />
			</div>
			<div className="space-y-3"><SkeletonLine className="h-12 w-full" /><SkeletonLine className="h-12 w-full" /><SkeletonLine className="h-12 w-full" /></div>
		</section>
	);
}
