// Reduit une photo trop grande avant envoi, sans perte visible :
// meme rendu a l'ecran, mais un fichier beaucoup plus leger.
// Les photos deja raisonnables (ecrans, captures) ne sont pas touchees.

const MAX_DIMENSION = 1600; // largeur/hauteur max, suffisant pour tout affichage mobile/web
const QUALITY = 0.95; // tres haute qualite, perte imperceptible

export function resizeImageIfNeeded(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
      // Ne touche pas aux GIF (animation perdue par un canvas) ni aux non-images
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const { width, height } = img;

      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
        // Deja assez petite, on ne touche a rien
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            resolve(file); // en cas d'echec, on envoie l'originale plutot que de bloquer
            return;
          }
          const resizedFile = new File([blob], file.name, { type: file.type || "image/jpeg" });
          resolve(resizedFile);
        },
        file.type === "image/png" ? "image/png" : "image/jpeg",
        QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // en cas d'echec de lecture, on envoie l'originale
    };

    img.src = url;
  });
}
