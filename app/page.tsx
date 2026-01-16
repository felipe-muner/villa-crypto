import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { db, villas } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  Bitcoin,
  Shield,
  Sparkles,
  ArrowRight,
  Star,
  MapPin,
  Users,
  Wallet,
  BadgeCheck,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch featured villas
  const featuredVillas = await db
    .select()
    .from(villas)
    .where(eq(villas.isActive, true))
    .limit(3);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-villa-navy via-villa-navy/95 to-villa-navy" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        {/* Gold accent gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-villa-gold/10 to-transparent" />

        <div className="relative luxury-container py-24 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-villa-gold/10 border border-villa-gold/20 mb-6">
                <Sparkles className="w-4 h-4 text-villa-gold" />
                <span className="text-sm font-medium text-villa-gold">
                  Pay with Cryptocurrency
                </span>
              </div>

              <h1 className="text-white mb-6 text-balance">
                Discover Luxury{" "}
                <span className="text-villa-gold">Villas</span> Worldwide
              </h1>

              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Experience unparalleled luxury in handpicked villas. Book
                seamlessly with Bitcoin, Ethereum, or USDT — secure, private,
                and effortless.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/villas">
                  <Button
                    size="lg"
                    className="rounded-full px-8 h-14 text-base font-medium bg-villa-gold hover:bg-villa-gold/90 text-villa-navy shadow-lg shadow-villa-gold/25 hover:shadow-xl hover:shadow-villa-gold/30 transition-all duration-300"
                  >
                    Explore Villas
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 h-14 text-base font-medium border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                <div className="flex items-center gap-2 text-white/60">
                  <BadgeCheck className="w-5 h-5 text-villa-sage" />
                  <span className="text-sm">Verified Hosts</span>
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Shield className="w-5 h-5 text-villa-sage" />
                  <span className="text-sm">Secure Payments</span>
                </div>
              </div>
            </div>

            {/* Hero image placeholder */}
            <div className="relative hidden lg:block">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-villa-gold/20 to-villa-coral/20" />
                <Image
                  src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80"
                  alt="Luxury Villa"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-villa-navy/60 to-transparent" />

                {/* Floating card */}
                <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">
                        Oceanview Paradise
                      </p>
                      <p className="text-white/70 text-sm flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Bali, Indonesia
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-villa-gold font-bold text-lg">$450</p>
                      <p className="text-white/60 text-xs">per night</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-villa-gold/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-villa-coral/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Crypto Payment Section */}
      <section className="section bg-background">
        <div className="luxury-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">
              Pay Your Way with <span className="text-villa-gold">Crypto</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We accept the world&apos;s leading cryptocurrencies for a seamless and
              private booking experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Bitcoin */}
            <div className="group relative bg-card rounded-3xl p-8 border border-border/50 hover:border-villa-gold/30 hover:shadow-luxury transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#f7931a]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bitcoin className="w-8 h-8 text-[#f7931a]" />
              </div>
              <h4 className="font-sans text-xl font-semibold mb-3">Bitcoin</h4>
              <p className="text-muted-foreground leading-relaxed">
                The original cryptocurrency. Secure, decentralized, and globally
                accepted for your luxury bookings.
              </p>
            </div>

            {/* Ethereum */}
            <div className="group relative bg-card rounded-3xl p-8 border border-border/50 hover:border-villa-gold/30 hover:shadow-luxury transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#627eea]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-[#627eea]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                </svg>
              </div>
              <h4 className="font-sans text-xl font-semibold mb-3">Ethereum</h4>
              <p className="text-muted-foreground leading-relaxed">
                Fast and flexible. Pay with ETH and enjoy quick confirmations
                and low transaction fees.
              </p>
            </div>

            {/* USDT */}
            <div className="group relative bg-card rounded-3xl p-8 border border-border/50 hover:border-villa-gold/30 hover:shadow-luxury transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-[#26a17b]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Wallet className="w-8 h-8 text-[#26a17b]" />
              </div>
              <h4 className="font-sans text-xl font-semibold mb-3">
                USDT Stablecoin
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                Price stability meets crypto convenience. Pay exactly what you
                see with no volatility concerns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Villas */}
      {featuredVillas.length > 0 && (
        <section className="section bg-secondary/30">
          <div className="luxury-container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="mb-3">Featured Villas</h2>
                <p className="text-muted-foreground text-lg">
                  Handpicked luxury properties for your next escape
                </p>
              </div>
              <Link href="/villas">
                <Button
                  variant="outline"
                  className="rounded-full hidden sm:inline-flex"
                >
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredVillas.map((villa) => (
                <Link
                  key={villa.id}
                  href={`/villas/${villa.id}`}
                  className="group"
                >
                  <div className="villa-card h-full">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {villa.images && villa.images.length > 0 ? (
                        <Image
                          src={villa.images[0]}
                          alt={villa.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
                          <Star className="w-4 h-4 text-villa-gold fill-villa-gold" />
                          <span className="text-sm font-medium">4.9</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-sans text-lg font-semibold group-hover:text-villa-gold transition-colors">
                          {villa.name}
                        </h4>
                      </div>
                      {villa.location && (
                        <p className="text-muted-foreground text-sm flex items-center gap-1 mb-4">
                          <MapPin className="w-4 h-4" />
                          {villa.location}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {villa.maxGuests}
                          </span>
                          <span>{villa.bedrooms} beds</span>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-foreground">
                            ${Number(villa.pricePerNight).toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            per night
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/villas">
                <Button variant="outline" className="rounded-full">
                  View All Villas
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it Works */}
      <section className="section bg-background">
        <div className="luxury-container">
          <div className="text-center mb-16">
            <h2 className="mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Book your dream villa in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-villa-gold/10 flex items-center justify-center mx-auto mb-6 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-villa-gold text-villa-navy text-sm font-bold flex items-center justify-center">
                  1
                </span>
                <Sparkles className="w-7 h-7 text-villa-gold" />
              </div>
              <h4 className="font-sans text-xl font-semibold mb-3">
                Browse & Select
              </h4>
              <p className="text-muted-foreground">
                Explore our curated collection of luxury villas and find your
                perfect match.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-villa-gold/10 flex items-center justify-center mx-auto mb-6 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-villa-gold text-villa-navy text-sm font-bold flex items-center justify-center">
                  2
                </span>
                <Wallet className="w-7 h-7 text-villa-gold" />
              </div>
              <h4 className="font-sans text-xl font-semibold mb-3">
                Pay with Crypto
              </h4>
              <p className="text-muted-foreground">
                Send payment using Bitcoin, Ethereum, or USDT to our secure
                wallet address.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-villa-gold/10 flex items-center justify-center mx-auto mb-6 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-villa-gold text-villa-navy text-sm font-bold flex items-center justify-center">
                  3
                </span>
                <Clock className="w-7 h-7 text-villa-gold" />
              </div>
              <h4 className="font-sans text-xl font-semibold mb-3">
                Confirm & Enjoy
              </h4>
              <p className="text-muted-foreground">
                Receive instant confirmation and prepare for your luxurious
                getaway.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-villa-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-villa-gold/5 to-villa-coral/5" />
        <div className="luxury-container relative">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-white mb-6">
              Ready to Experience{" "}
              <span className="text-villa-gold">Luxury</span>?
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Join thousands of travelers who book their dream villas with
              cryptocurrency. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/villas">
                <Button
                  size="lg"
                  className="rounded-full px-8 h-14 text-base font-medium bg-villa-gold hover:bg-villa-gold/90 text-villa-navy"
                >
                  Browse Villas
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 h-14 text-base font-medium border-white/20 text-white hover:bg-white/10"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/50 py-12">
        <div className="luxury-container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-villa-gold to-villa-coral rounded-lg flex items-center justify-center">
                <span className="text-white font-serif font-bold text-sm">
                  V
                </span>
              </div>
              <span className="font-serif text-lg font-semibold">
                VillaCrypto
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/villas" className="hover:text-foreground transition-colors">
                Villas
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Sign In
              </Link>
              <span>© 2024 VillaCrypto</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
