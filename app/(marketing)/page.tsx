import type { Metadata } from 'next';
import { siteDescription, siteTitle, siteUrl } from '../../lib/config/brand';
import LandingPage from '../../components/LandingPage/LandingPage';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: {
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
  },
};

export default LandingPage;
