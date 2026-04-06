
import "./Modal.css";

export default function Modal({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        {title && <h2 className="modal-title">{title}</h2>}
        <p className="modal-text">{message}</p>
        <button className="modal-btn" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}