import { COPY } from "@/lib/copy";

const testimonials = [
  {
    quote: "I used to wait 45 days to find out if a job made money. Now I know before the crew leaves site.",
    name: "Mike T.",
    title: "Owner, Northwind HVAC",
  },
  {
    quote: "My crew just texts their costs in. No apps, no spreadsheets. It just works.",
    name: "Sarah L.",
    title: "PM, ProFlow Plumbing",
  },
  {
    quote: "We caught a $12K cost overrun in real-time. TrueMargin paid for itself on day one.",
    name: "Dave R.",
    title: "Owner, Apex Electrical",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pick a random-ish testimonial based on the current minute
  const testimonial = testimonials[new Date().getMinutes() % testimonials.length]!;

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branded hero (hidden on mobile) */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-12 text-white lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-xl font-bold backdrop-blur-sm">
              T
            </div>
            <span className="text-2xl font-bold tracking-tight">
              {COPY.APP_NAME}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              {COPY.TAGLINE}
            </h2>
            <p className="max-w-md text-lg text-emerald-100">
              Real-time job costing for Canadian trade contractors. Track every
              dollar from estimate to close.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              "Live margin tracking on every job",
              "Crew logs costs via text message",
              "Change orders signed digitally on-site",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg
                    className="h-3.5 w-3.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-emerald-50">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="space-y-4">
          <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-emerald-50">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold">{testimonial.name}</p>
                <p className="text-xs text-emerald-200">
                  {testimonial.title}
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-emerald-200">
            Trusted by 200+ Canadian trade contractors
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-8 lg:w-1/2">
        {/* Mobile-only branding */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            T
          </div>
          <h1 className="text-2xl font-bold text-primary">{COPY.APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.TAGLINE}</p>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
