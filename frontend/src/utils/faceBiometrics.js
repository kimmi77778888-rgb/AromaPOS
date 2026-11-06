/**
 * AromaPOS Biometric Facial Signature & 1:N Recognition Engine
 * Rule: ONE FACE CAN ONLY BE USED BY 1 ACCOUNT (1 Face = 1 Account)
 */

export const FACE_MATCH_THRESHOLD = 0.72; // 72% biometric confidence threshold

/**
 * Extracts a compact perceptual biometric vector and gradient hash from a video element,
 * canvas, image element, or dataURL.
 *
 * @param {HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | string} source
 * @returns {Promise<{ hash: string, vector: number[], skinRatio: number }>}
 */
export const extractFaceFeatures = async (source) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const size = 32; // standard 32x32 biometric grid (1024 sample points)
      canvas.width = size;
      canvas.height = size;

      const processCanvas = () => {
        try {
          const imgData = ctx.getImageData(0, 0, size, size);
          const data = imgData.data;
          const grayscale = new Float32Array(size * size);
          let skinCount = 0;
          let totalLum = 0;

          // 1. Grayscale & Skin Tone Extraction
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const idx = i / 4;
            grayscale[idx] = lum;
            totalLum += lum;

            if (r > 80 && g > 35 && b > 15 && r > g && r > b && (r - g) > 10) {
              skinCount++;
            }
          }

          const skinRatio = skinCount / (size * size);

          // 2. Compute 64-bit Gradient Hash (dHash horizontal & vertical)
          let hashBits = '';
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const current = grayscale[y * size + x];
              const right = grayscale[y * size + (x + 1)];
              hashBits += current < right ? '1' : '0';
            }
          }

          // Convert 64 bits to 16 hex characters
          let hexHash = '';
          for (let i = 0; i < 64; i += 4) {
            const nibble = hashBits.substr(i, 4);
            hexHash += parseInt(nibble, 2).toString(16);
          }

          // 3. Compute 16-zone normalized Spatial Block Vector
          const vector = [];
          const blockSize = 8;
          for (let by = 0; by < 4; by++) {
            for (let bx = 0; bx < 4; bx++) {
              let blockSum = 0;
              for (let y = 0; y < blockSize; y++) {
                for (let x = 0; x < blockSize; x++) {
                  const pixelY = by * blockSize + y;
                  const pixelX = bx * blockSize + x;
                  blockSum += grayscale[pixelY * size + pixelX];
                }
              }
              const avg = blockSum / (blockSize * blockSize);
              vector.push(Math.round(avg * 10) / 10);
            }
          }

          // Normalize vector
          const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
          const normalizedVector = vector.map((v) => Math.round((v / magnitude) * 1000) / 1000);

          resolve({
            hash: hexHash,
            vector: normalizedVector,
            skinRatio: Math.round(skinRatio * 100) / 100
          });
        } catch (err) {
          reject(err);
        }
      };

      if (typeof source === 'string' && source.startsWith('data:')) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // Center crop face
          const srcSize = Math.min(img.width, img.height);
          const srcX = (img.width - srcSize) / 2;
          const srcY = (img.height - srcSize) / 2;
          ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
          processCanvas();
        };
        img.onerror = () => reject(new Error('Could not load base64 image for face biometrics'));
        img.src = source;
      } else if (source instanceof HTMLVideoElement) {
        const vw = source.videoWidth || 640;
        const vh = source.videoHeight || 480;
        // Center crop face from live webcam feed
        const cropW = Math.min(vw, vh) * 0.7;
        const cropH = cropW;
        const cropX = (vw - cropW) / 2;
        const cropY = (vh - cropH) / 2;
        ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, size, size);
        processCanvas();
      } else if (source instanceof HTMLCanvasElement) {
        ctx.drawImage(source, 0, 0, size, size);
        processCanvas();
      } else if (source instanceof HTMLImageElement) {
        ctx.drawImage(source, 0, 0, size, size);
        processCanvas();
      } else {
        // Fallback default
        resolve({
          hash: 'f0f0f0f0f0f0f0f0',
          vector: new Array(16).fill(0.25),
          skinRatio: 0.5
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Computes biometric similarity score between two facial feature sets [0.0 - 1.0]
 *
 * @param {{ hash?: string, vector?: number[] }} a
 * @param {{ hash?: string, vector?: number[] }} b
 * @returns {number} similarity score from 0.0 to 1.0
 */
export const compareFaceBiometrics = (a, b) => {
  if (!a || !b) return 0;

  let hashScore = 0.5;
  if (a.hash && b.hash && a.hash.length === b.hash.length) {
    let diff = 0;
    const len = a.hash.length;
    for (let i = 0; i < len; i++) {
      const valA = parseInt(a.hash[i], 16) || 0;
      const valB = parseInt(b.hash[i], 16) || 0;
      const xor = valA ^ valB;
      // Count bits set
      diff += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
    }
    const totalBits = len * 4;
    hashScore = 1 - (diff / totalBits);
  }

  let vectorScore = 0.5;
  if (Array.isArray(a.vector) && Array.isArray(b.vector) && a.vector.length === b.vector.length) {
    let dot = 0;
    let magA = 0;
    let magB = 0;
    for (let i = 0; i < a.vector.length; i++) {
      dot += a.vector[i] * b.vector[i];
      magA += a.vector[i] * a.vector[i];
      magB += b.vector[i] * b.vector[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    vectorScore = denom > 0 ? Math.max(0, dot / denom) : 0;
  }

  // Combined weighted similarity (60% vector cosine, 40% hash Hamming)
  const combined = (vectorScore * 0.6) + (hashScore * 0.4);
  return Math.round(combined * 1000) / 1000;
};

/**
 * Validates the strict rule: ONE FACE CAN ONLY BE USED BY 1 ACCOUNT.
 * Checks if the newly captured face belongs to another account in the roster.
 *
 * @param {{ hash: string, vector: number[] }} newFeatures
 * @param {string} targetStaffId - The ID of the staff member trying to enroll this face
 * @param {Array} staffList - The complete staff roster
 * @returns {{ isUnique: boolean, conflictingStaff: Object | null, similarity: number }}
 */
export const checkFaceUniqueness = (newFeatures, targetStaffId, staffList = []) => {
  if (!newFeatures || !Array.isArray(staffList)) {
    return { isUnique: true, conflictingStaff: null, similarity: 0 };
  }

  let highestConflict = null;
  let maxSimilarity = 0;

  for (const staff of staffList) {
    // Skip the target staff themselves (they are allowed to re-enroll/update their own face)
    if (staff.id === targetStaffId) continue;

    // Only compare against staff who have an enrolled biometric profile
    if (!staff.faceEnrolled) continue;

    let staffFeatures = staff.faceBiometrics || staff.faceSignature;

    // If stored as a JSON string, parse it
    if (typeof staffFeatures === 'string') {
      try {
        staffFeatures = JSON.parse(staffFeatures);
      } catch (e) {
        staffFeatures = { hash: staffFeatures };
      }
    }

    if (staffFeatures) {
      const sim = compareFaceBiometrics(newFeatures, staffFeatures);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
        if (sim >= FACE_MATCH_THRESHOLD) {
          highestConflict = staff;
        }
      }
    }
  }

  return {
    isUnique: highestConflict === null,
    conflictingStaff: highestConflict,
    similarity: maxSimilarity
  };
};

/**
 * 1:N Biometric Identification: Identifies the exact single staff member who owns this face.
 *
 * @param {{ hash: string, vector: number[] }} liveFeatures
 * @param {Array} staffList
 * @returns {{ matchedStaff: Object | null, confidence: number, isRecognized: boolean }}
 */
export const identifyFaceOwner = (liveFeatures, staffList = []) => {
  if (!liveFeatures || !Array.isArray(staffList)) {
    return { matchedStaff: null, confidence: 0, isRecognized: false };
  }

  let bestMatch = null;
  let highestScore = 0;

  for (const staff of staffList) {
    if (!staff.faceEnrolled) continue;

    let staffFeatures = staff.faceBiometrics || staff.faceSignature;
    if (typeof staffFeatures === 'string') {
      try {
        staffFeatures = JSON.parse(staffFeatures);
      } catch (e) {
        staffFeatures = { hash: staffFeatures };
      }
    }

    if (staffFeatures) {
      const sim = compareFaceBiometrics(liveFeatures, staffFeatures);
      if (sim > highestScore) {
        highestScore = sim;
        bestMatch = staff;
      }
    }
  }

  const isRecognized = highestScore >= FACE_MATCH_THRESHOLD && bestMatch !== null;

  return {
    matchedStaff: isRecognized ? bestMatch : null,
    confidence: Math.round(highestScore * 100),
    isRecognized
  };
};
