import { useState } from "react";
import Cropper from "react-easy-crop";

function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

async function getCroppedImageBlob(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("크롭된 이미지를 생성하지 못했습니다."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export default function ProfileImageCropModal({
  imageSrc,
  onClose,
  onComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleConfirm = async () => {
    try {
      if (!croppedAreaPixels) return;

      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const preview = URL.createObjectURL(blob);
      const file = new File([blob], `profile_${Date.now()}.png`, {
        type: "image/png",
      });

      onComplete({ file, preview });
    } catch (error) {
      console.error("이미지 크롭 실패:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-box">
        <button
          type="button"
          className="crop-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="crop-modal-title">프로필 이미지 편집</div>

        <div className="crop-modal-body">
          <div className="crop-area">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) =>
                setCroppedAreaPixels(croppedPixels)
              }
            />
          </div>

          <div className="crop-zoom-wrap">
            <label htmlFor="cropZoom" className="crop-zoom-label">
              확대 / 축소
            </label>

            <span className="zoom-mark">-</span>

            <div className="slider-container">
              <input
                id="cropZoom"
                className="crop-zoom-range"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>

            <span className="zoom-mark">+</span>
          </div>
        </div>

        <div className="crop-modal-footer">
          <button
            type="button"
            className="crop-btn crop-btn-cancel"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="crop-btn crop-btn-confirm"
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}