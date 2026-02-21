import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Toast } from "./design-system";
import "./ShareActions.css";

// Simple QR Code generator using Google Charts API
const QRCodeImage = ({ value, size = 300 }) => {
  const encodedValue = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}`;

  return (
    <img
      src={qrUrl}
      alt="QR Code"
      style={{ width: size, height: size, display: "block" }}
    />
  );
};

const ShareActions = ({ url, libraryName }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage("Link copied to clipboard!");
      setToastType("success");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMessage("Failed to copy link");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDownloadPNG = async () => {
    const img = document.getElementById("qr-image");
    if (!img) return;

    // Create a canvas to convert the image
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    // Draw the image on canvas
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = img.src;

    image.onload = () => {
      ctx.drawImage(image, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${libraryName.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`;
      link.href = pngUrl;
      link.click();
    };
  };

  const handleDownloadSVG = () => {
    // For SVG, we'll use a larger size from the API
    const encodedValue = encodeURIComponent(url);
    const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&format=svg&data=${encodedValue}`;

    fetch(svgUrl)
      .then((response) => response.text())
      .then((svgData) => {
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const blobUrl = URL.createObjectURL(svgBlob);
        const link = document.createElement("a");
        link.download = `${libraryName.replace(/\s+/g, "-").toLowerCase()}-qr-code.svg`;
        link.href = blobUrl;
        link.click();
        URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.error("Failed to download SVG:", err);
        alert("Failed to download SVG. Please try PNG instead.");
      });
  };

  return (
    <>
      <div className="share-actions">
        <code className="share-actions__url">{url}</code>
        <Button size="sm" variant="flat" onPress={handleCopy}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </Button>
        <Button size="sm" variant="flat" onPress={onOpen}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <rect x="7" y="7" width="10" height="10" />
          </svg>
          QR Code
        </Button>
      </div>

      {/* QR Code Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {libraryName} - QR Code
          </ModalHeader>
          <ModalBody>
            <div className="share-actions__qr-display">
              <QRCodeImage id="qr-image" value={url} size={300} />
            </div>
            <p className="text-center text-sm">Scan to view song library</p>
            <p className="text-center text-xs text-default-500">
              Download as SVG for printing large posters (A4 size)
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={handleDownloadPNG}>
              Download PNG
            </Button>
            <Button variant="flat" onPress={handleDownloadSVG}>
              Download SVG
            </Button>
            <Button color="primary" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Toast */}
      {showToast && (
        <Toast
          type={toastType}
          message={toastMessage}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};

export default ShareActions;
