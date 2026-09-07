import Image from "next/image";
import type { PageSection } from "@/db/schema";
import type { SiteSettings } from "@/lib/settings-types";
import { buildWhatsAppLink, telLink } from "@/lib/whatsapp";
import { Reveal } from "@/components/site/Reveal";
import { Button3D } from "@/components/ui/Button3D";
import { InquiryForm, type FormMarket, type FormProject } from "@/components/site/InquiryForm";

type Props = { section: PageSection; settings: SiteSettings; markets: FormMarket[]; projects: FormProject[] };

export function InquirySection({ section, settings: s, markets, projects }: Props) {
  const title = section.title || "Let’s Find the Right Property for You";
  const words = title.split(" ");
  return (
    <section id="inquiry" className="relative overflow-hidden py-24 lg:py-32" aria-labelledby="inquiry-title">
      {section.image && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
          <Image src={section.image} alt="" fill className="object-cover" sizes="46vw" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--color-ivory)_0%,rgba(246,245,240,0.6)_30%,transparent_100%)]" />
        </div>
      )}
      <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 sm:px-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow">{section.eyebrow || "Contact"}</p>
          <h2 id="inquiry-title" className="display mt-4 text-[clamp(2rem,3.6vw,3rem)] uppercase text-ink">
            {words.slice(0, 3).join(" ")} <span className="text-brand">{words.slice(3, 4)}</span> {words.slice(4).join(" ")}
          </h2>
          {section.body && <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-charcoal/80">{section.body}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button3D href={buildWhatsAppLink(s.whatsapp, s.whatsappDefaultMessage)} variant="whatsapp" icon="whatsapp" external>Chat on WhatsApp</Button3D>
            <Button3D href={telLink(s.phone)} variant="secondary" icon="phone">{s.phone}</Button3D>
          </div>
          <p className="mt-6 text-[13px] text-charcoal/70">{s.email} · {s.workingHours}</p>
        </Reveal>
        <Reveal className="lg:col-span-7 lg:col-start-6" y={50}>
          <InquiryForm fields={s.contactFields} markets={markets} projects={projects} budgetOptions={s.budgetOptions} interestOptions={s.interestOptions} cityFieldEnabled={s.cityFieldEnabled} customBudgetEnabled={s.customBudgetEnabled} source="homepage" />
        </Reveal>
      </div>
    </section>
  );
}
