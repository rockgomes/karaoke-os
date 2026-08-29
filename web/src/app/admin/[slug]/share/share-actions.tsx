"use client";

import { useState } from "react";

const button =
  "rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium " +
  "hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-blue-600 dark:border-neutral-700 dark:hover:bg-neutral-900";

export default function ShareActions({ url, slug }: { url: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. Selecting the text still works.
      window.prompt("Copy this link:", url);
    }
  }

  /** Pull the rendered QR back out of the page rather than generating it twice. */
  function qrSvg(): SVGSVGElement | null {
    return document.querySelector("#table-card svg");
  }

  function downloadSvg() {
    const svg = qrSvg();
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    save(URL.createObjectURL(blob), `${slug}-qr.svg`);
  }

  function downloadPng() {
    const svg = qrSvg();
    if (!svg) return;

    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    // A blob URL would taint the canvas in some browsers; a data URI does not.
    image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(source)))}`;

    image.onload = () => {
      const size = 1024; // large enough to print without going soft
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(image, 0, 0, size, size);
      canvas.toBlob((blob) => {
        if (blob) save(URL.createObjectURL(blob), `${slug}-qr.png`);
      }, "image/png");
    };
  }

  function save(href: string, filename: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <button type="button" onClick={copy} className={button}>
        {copied ? "Link copied" : "Copy the link"}
      </button>
      <button type="button" onClick={() => window.print()} className={button}>
        Print the card
      </button>
      <button type="button" onClick={downloadPng} className={button}>
        Download PNG
      </button>
      <button type="button" onClick={downloadSvg} className={button}>
        Download SVG
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard" : ""}
      </span>
    </div>
  );
}
