export const cropAndCompressImages = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const size = Math.min(img.width, img.height);

        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        const CANVAS_SIZE = 300;
        const canvas = document.createElement("canvas");
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx?.drawImage(
          img,
          startX,
          startY,
          size,
          size,
          0,
          0,
          CANVAS_SIZE,
          CANVAS_SIZE
        );

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };

      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
