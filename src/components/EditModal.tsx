import { useRef, useState } from "react";
import type { RankedItem } from "../types";
import { cropAndCompressImage } from "../utils/imageUtils";
import { useDropzone } from "react-dropzone";

type EditModalProps = {
  item: RankedItem;
  onSave: (id: string, newName: string, newImage?: string) => void;
  onCancel: () => void;
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.7)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
};

const modalContentStyle: React.CSSProperties = {
  background: "#1e293b",
  padding: "2rem",
  borderRadius: "16px",
  width: "90%",
  maxWidth: "400px",
  border: "1px solid rgba(148,163,184,0.2)",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
};

export function EditModal({ item, onSave, onCancel }: EditModalProps) {
  const [name, setName] = useState(item.name);
  const [image, setImage] = useState<string | undefined>(item.image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    try {
      const compressed = await cropAndCompressImage(file);
      setImage(compressed);
    } catch (err) {
      console.error("Error processing image", err);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files: File[]) => files[0] && processFile(files[0]),
    accept: { "image/*": [] },
    multiple: false,
    noClick: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSave(item.id, name, image);
  };
  return (
    <div style={modalOverlayStyle} onClick={onCancel}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, color: "#e2e8f0" }}>Edit Item</h2>

        <div
          {...getRootProps()}
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            borderRadius: "8px",
            border: isDragActive ? "2px dashed #38bdf8" : "2px dashed #475569",
            textAlign: "center",
            cursor: "pointer",
            background: isDragActive ? "rgba(56,189,248,0.1)" : "transparent",
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input {...getInputProps()} />
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) =>
              e.target.files?.[0] && processFile(e.target.files[0])
            }
          />

          {image ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundImage: `url(${image})`,
                  backgroundSize: "cover",
                  border: "2px solid #38bdf8",
                }}
              />
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Click to change image
              </span>
            </div>
          ) : (
            <div style={{ padding: "1rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📷</div>
              <div style={{ fontSize: "0.9rem" }}>Upload new photo</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                color: "#94a3b8",
                fontSize: "0.85rem",
                marginBottom: "0.5rem",
              }}
            >
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #475569",
                background: "#0f172a",
                color: "white",
                fontSize: "1rem",
              }}
            />
          </div>

          <div
            style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "0.5rem 1rem",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              style={{
                background: "#38bdf8",
                color: "#0f172a",
                border: "none",
                padding: "0.5rem 1.5rem",
                borderRadius: "99px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
