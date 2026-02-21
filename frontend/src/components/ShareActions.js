import React, { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { Toast } from './design-system';
import './ShareActions.css';

const ShareActions = ({ url, libraryName }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setToastMessage('Link copied to clipboard!');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      setToastMessage('Failed to copy link');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('qr-canvas');
    if (!canvas) return;
    
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${libraryName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
    link.href = pngUrl;
    link.click();
  };

  const handleDownloadSVG = () => {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.download = `${libraryName.replace(/\s+/g, '-').toLowerCase()}-qr-code.svg`;
    link.href = blobUrl;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <>
      <div className="share-actions">
        <code className="share-actions__url">
          {url}
        </code>
        <Button size="sm" variant="flat" onPress={handleCopy}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </Button>
        <Button size="sm" variant="flat" onPress={onOpen}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <QRCodeCanvas
                id="qr-canvas"
                value={url}
                size={300}
                level="H"
                includeMargin={true}
              />
              <QRCodeSVG
                id="qr-svg"
                value={url}
                size={300}
                level="H"
                includeMargin={true}
                style={{ display: 'none' }}
              />
            </div>
            <p className="text-center text-sm">
              Scan to view song library
            </p>
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
