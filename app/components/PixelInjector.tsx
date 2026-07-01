'use client';

import { useEffect } from 'react';
import { fetchPixelCodes } from '@/lib/api';

interface PixelInjectorProps {
  eventId: number;
}

export default function PixelInjector({ eventId }: PixelInjectorProps) {
  useEffect(() => {
    const injectPixels = async () => {
      try {
        const res = await fetchPixelCodes(eventId);
        const pixels = res.data;

        if (!pixels) return;

        // Inject Facebook Pixel
        if (pixels.facebook_pixel_code) {
          const fbScript = document.createElement('script');
          fbScript.innerHTML = pixels.facebook_pixel_code;
          document.head.appendChild(fbScript);
        }

        // Inject LinkedIn Pixel
        if (pixels.linkedin_pixel_code) {
          const liScript = document.createElement('script');
          liScript.innerHTML = pixels.linkedin_pixel_code;
          document.head.appendChild(liScript);
        }

        // Inject Twitter Pixel
        if (pixels.twitter_pixel_code) {
          const twitterScript = document.createElement('script');
          twitterScript.innerHTML = pixels.twitter_pixel_code;
          document.head.appendChild(twitterScript);
        }

        // Inject Google Analytics (gtag)
        if (pixels.gtag_code) {
          const gtagScript = document.createElement('script');
          gtagScript.innerHTML = pixels.gtag_code;
          document.head.appendChild(gtagScript);
        }

        // Inject Custom Pixel
        if (pixels.custom_pixel_code) {
          const customScript = document.createElement('script');
          customScript.innerHTML = pixels.custom_pixel_code;
          document.head.appendChild(customScript);
        }
      } catch (err) {
        console.debug('Failed to load pixel codes:', err);
      }
    };

    injectPixels();
  }, [eventId]);

  return null; // This component doesn't render anything
}
