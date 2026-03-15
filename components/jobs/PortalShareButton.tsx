"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";

interface PortalShareButtonProps {
  portalToken: string | null;
}

export function PortalShareButton({ portalToken }: PortalShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  if (!portalToken) return null;

  const portalUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${portalToken}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = portalUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowPopover(!showPopover)}
        className="gap-1.5"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
        {COPY.PORTAL_SHARE_LINK}
      </Button>

      {showPopover && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowPopover(false)}
          />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border bg-white p-4 shadow-lg animate-scale-in">
            <h4 className="text-sm font-semibold text-foreground mb-1">
              {COPY.PORTAL_SHARE_LINK}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              Share this link with your customer so they can view project
              progress. No login required.
            </p>

            <div className="flex gap-2">
              <input
                readOnly
                value={portalUrl}
                className="flex-1 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs font-mono text-muted-foreground truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={handleCopy}
                className="shrink-0 gap-1"
              >
                {copied ? (
                  <>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                      />
                    </svg>
                    {COPY.PORTAL_COPY_LINK}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
