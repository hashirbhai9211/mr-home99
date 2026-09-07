import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLegalPage, getSettings } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Markdown } from "@/components/site/Markdown";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegalPage(slug);
  if (!page) return { title: "Not found", robots: { index: false } };
  return buildMetadata(`/${slug}`, { title: page.seoTitle || page.title, description: page.seoDescription });
}

export default async function LegalPageRoute({ params }: { params: Params }) {
  const { slug } = await params;
  const [page, s] = await Promise.all([getLegalPage(slug), getSettings()]);
  if (!page) notFound();
  return (
    <article className="pt-32 pb-24 lg:pt-40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: page.title, href: `/${page.slug}` }]} />
        <p className="mt-8 text-[12px] text-mist">Last updated {formatDate(page.updatedAt)}</p>
        <Markdown content={page.content} className="prose-legal mt-2" />
        <div className="mt-12 rounded-3xl bg-ivory-deep/70 p-6 text-[13.5px] text-charcoal">
          <p className="font-semibold text-ink">{s.brandName}</p>
          <p>{s.address}</p>
          <p>{s.email} · {s.phone}</p>
        </div>
      </div>
    </article>
  );
}
