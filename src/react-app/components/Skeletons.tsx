function SkeletonLine({ className = "" }: { className?: string }) {
	return <span className={"skeleton block h-3 " + className} aria-hidden="true" />;
}

export function PluginGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="plugin-grid-skeleton grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading plugins">
			{Array.from({ length: count }, (_, index) => (
				<div key={index} className="plugin-card card w-full border border-base-300 bg-base-100">
					<div className="plugin-preview-shell"><div className="plugin-preview skeleton aspect-[2/1] w-full" aria-hidden="true" /></div>
					<div className="card-body gap-3">
						<SkeletonLine className="h-4 w-3/5" />
						<SkeletonLine className="w-full" /><SkeletonLine className="w-4/5" />
						<div className="mt-auto flex justify-between gap-3 border-t border-base-300 pt-3"><SkeletonLine className="w-1/3" /><SkeletonLine className="w-1/4" /></div>
					</div>
				</div>
			))}
		</div>
	);
}

export function HomeSkeleton() {
	return (
		<div className="home-skeleton" role="status" aria-label="Loading home page">
			<section className="home-hero"><div className="hero-copy space-y-4"><SkeletonLine className="h-3 w-40" /><SkeletonLine className="h-16 w-4/5" /><SkeletonLine className="h-5 w-2/3" /><SkeletonLine className="h-12 w-full max-w-xl" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><SkeletonLine className="h-12" /><SkeletonLine className="h-12" /><SkeletonLine className="h-12" /><SkeletonLine className="h-12" /><SkeletonLine className="h-12" /></div></div><div className="hero-art hidden lg:block"><span className="skeleton block h-full min-h-80 w-full" /></div></section>
			<div className="category-bar"><SkeletonLine className="h-8 w-full" /></div>
			<PluginGridSkeleton count={3} />
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
