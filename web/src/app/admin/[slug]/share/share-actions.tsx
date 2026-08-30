"use client";

import { useState } from "react";

const button =
  "inline-flex h-11 w-full items-center justify-center rounded-lg border " +
  "border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2";

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
    <div className="mt-5">
      {/*
       * A stack with the primary action on top, not four ghost buttons in a
       * row. Printing is what a venue actually does with this; the downloads
       * are for whoever makes their signage.
       */}
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-11 w-full items-center justify-center rounded-lg
                   bg-accent px-4 text-sm font-medium text-accent-ink
                   hover:bg-accent-hover"
      >
        Print the card
      </button>

      <button type="button" onClick={copy} className={`${button} mt-2`}>
        {copied ? "Link copied" : "Copy the link"}
      </button>

      <p className="mt-5 text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">
        Download the code
      </p>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={downloadPng} className={`${button} flex-1`}>
          PNG
        </button>
        <button type="button" onClick={downloadSvg} className={`${button} flex-1`}>
          SVG
        </button>
      </div>

      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard" : ""}
      </span>
    </div>
  );
}
