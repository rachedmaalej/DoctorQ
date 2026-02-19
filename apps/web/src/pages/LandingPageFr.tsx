import '../styles/landing-fr.css';
import FrHeader from '../components/landing-fr/FrHeader';
import FrHero from '../components/landing-fr/FrHero';
import FrSocialProof from '../components/landing-fr/FrSocialProof';
import FrBeforeAfter from '../components/landing-fr/FrBeforeAfter';
import FrHowItWorks from '../components/landing-fr/FrHowItWorks';
import FrBenefits from '../components/landing-fr/FrBenefits';
import FrTrust from '../components/landing-fr/FrTrust';
import FrPricing from '../components/landing-fr/FrPricing';
import FrFaq from '../components/landing-fr/FrFaq';
import FrCtaFooter from '../components/landing-fr/FrCtaFooter';

export default function LandingPageFr() {
  return (
    <div className="fr-landing min-h-screen">
      <FrHeader />
      <FrHero />
      <FrSocialProof />
      <FrBeforeAfter />
      <FrHowItWorks />
      <FrBenefits />
      <FrTrust />
      <FrPricing />
      <FrFaq />
      <FrCtaFooter />
    </div>
  );
}
