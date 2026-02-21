import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ isOpen, onScan, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    let stopped = false;
    hasScannedRef.current = false;

    const startScanner = async () => {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

      if (stopped || !scannerRef.current) return;

      const scanner = new Html5Qrcode("barcode-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
        ],
        verbose: false,
      });
      html5QrCodeRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
          },
          (decodedText) => {
            if (hasScannedRef.current) return;
            // ISBN: 10자리 또는 13자리 숫자
            const clean = decodedText.replace(/[^0-9X]/gi, "");
            if (clean.length === 10 || clean.length === 13) {
              hasScannedRef.current = true;
              onScan(clean);
            }
          },
          () => {} // ignore scan failures
        );
      } catch (err: unknown) {
        if (!stopped) {
          const message = err instanceof Error ? err.message : "";
          setError(
            message.includes("Permission")
              ? "카메라 접근이 필요해요. 브라우저 설정에서 카메라 권한을 허용해주세요."
              : "카메라를 시작할 수 없어요."
          );
        }
      }
    };

    startScanner();

    return () => {
      stopped = true;
      const scanner = html5QrCodeRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Camera size={20} />
          <span className="text-sm font-medium">바코드 스캔</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
        >
          <X size={20} />
        </button>
      </div>

      {/* 스캐너 영역 */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        {error ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-white/80">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white/20 px-6 py-2 text-sm text-white hover:bg-white/30"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <div
              id="barcode-reader"
              ref={scannerRef}
              className="w-full max-w-sm overflow-hidden rounded-2xl"
            />
            <p className="mt-4 text-center text-sm text-white/60">
              책 뒷면의 바코드를 카메라에 비춰주세요
            </p>
          </>
        )}
      </div>
    </div>
  );
}
