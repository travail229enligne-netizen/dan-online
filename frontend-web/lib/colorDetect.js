// Detecte la couleur dominante d'une image, sans aucun service externe :
// tout se calcule directement dans le navigateur (gratuit, instantane).

const NAMED_COLORS = [
  { name: "rouge", rgb: [200, 30, 30] },
  { name: "rose", rgb: [230, 130, 170] },
  { name: "orange", rgb: [230, 120, 30] },
  { name: "jaune", rgb: [225, 200, 40] },
  { name: "beige", rgb: [220, 200, 170] },
  { name: "marron", rgb: [110, 70, 40] },
  { name: "vert", rgb: [50, 140, 60] },
  { name: "turquoise", rgb: [40, 160, 160] },
  { name: "bleu", rgb: [40, 90, 190] },
  { name: "marine", rgb: [20, 30, 80] },
  { name: "violet", rgb: [120, 60, 160] },
  { name: "gris", rgb: [130, 130, 130] },
  { name: "noir", rgb: [25, 25, 25] },
  { name: "blanc", rgb: [240, 240, 240] },
  { name: "doré", rgb: [200, 170, 80] },
];

function closestColorName([r, g, b]) {
  let best = NAMED_COLORS[0];
  let bestDist = Infinity;
  for (const c of NAMED_COLORS) {
    const dist =
      (r - c.rgb[0]) ** 2 + (g - c.rgb[1]) ** 2 + (b - c.rgb[2]) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best.name;
}

export function detectDominantColorName(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        // Reduction de taille : suffisant pour la couleur moyenne, tres rapide
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 100) continue; // ignore les pixels transparents
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        if (count === 0) return reject(new Error("Image vide."));

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        URL.revokeObjectURL(url);
        resolve(closestColorName([r, g, b]));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Impossible de lire l'image."));
    img.src = url;
  });
}
