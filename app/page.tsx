import { CTASection, FeaturesSection, Footer, HeroSection, HowItWorksSection, Navbar } from "@/components/landing/LandingSections";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
