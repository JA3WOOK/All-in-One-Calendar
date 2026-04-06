import { useState } from "react";
import Cropper from "react-easy-crop";

export default function ProfileImageCropModal({
  imageSrc,
  onClose,
  onComplete,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleConfirm = () => {
    onComplete(imageSrc);
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
            />
          </div>

          <div className="crop-zoom-wrap">
            <label htmlFor="cropZoom" className="crop-zoom-label">
              확대 / 축소
            </label>
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