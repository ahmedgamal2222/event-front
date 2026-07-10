'use client';

import { useEffect } from 'react';
import { fetchPixelCodes } from '@/lib/api';

interface PixelInjectorProps {
  eventId: number;
}

/**
 * Safely inject a pixel/tracking code into <head>.
 * Handles two cases:
 *  1. Raw JS code (no <script> tag) → wraps in a new <script> element
 *  2. Full HTML with <script> tags → uses a hidden div + innerHTML trick
 *     so the browser parses and executes all script tags correctly
 */
function injectCode(code: string): void {
  if (!code?.trim()) return;

  const hasScriptTag = /<script[\s>]/i.test(code);

  if (hasScriptTag) {
    // Parse HTML containing one or more <script> tags
    const tmp = document.createElement('div');
    tmp.innerHTML = code;
    const scripts = tmp.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      // Copy attributes (type, src, async, etc.)
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      document.head.appendChild(newScript);
    });
  } else {
    // Plain JS code — wrap in a script element directly
    const script = document.createElement('script');
    script.textContent = code;
    document.head.appendChild(script);
  }
}

export default function PixelInjector({ eventId }: PixelInjectorProps) {
  useEffect(() => {
    const injectPixels = async () => {
      try {
        const res = await fetchPixelCodes(eventId);
        const pixels = res.data;
        if (!pixels) return;

        injectCode(pixels.facebook_pixel_code);
        injectCode(pixels.linkedin_pixel_code);
        injectCode(pixels.twitter_pixel_code);
        injectCode(pixels.gtag_code);
        injectCode(pixels.custom_pixel_code);
      } catch (err) {
        console.debug('Failed to load pixel codes:', err);
      }
    };

    injectPixels();
  }, [eventId]);

  return null;
}
