import { useState, useRef } from 'react';

const CLOUD_NAME = 'op1wrztj';
const UPLOAD_PRESET = 'dan-online';

export default function ImageUploadMulti({ values = [], onChange, label = 'Photos', max = 5 }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFilesChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = max - values.length;
    if (remaining <= 0) {
      setError(`Maximum ${max} photos.`);
      return;
    }

    setError('');
    setUploading(true);

    try {
      const uploads = files.slice(0, remaining).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );
        if (!res.ok) throw new Error('Échec upload');
        const data = await res.json();
        return data.secure_url;
      });

      const urls = await Promise.all(uploads);
      onChange([...values, ...urls]);
    } catch (err) {
      setError('Erreur lors de l\'envoi d\'une ou plusieurs photos. Réessaie.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeImage(index) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 600,
        color: '#111111',
        fontFamily: 'Inter, sans-serif',
      }}>
        {label} ({values.length}/{max})
      </label>

      {values.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {values.map((url, i) => (
            <div key={url + i} style={{ position: 'relative' }}>
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #e4e4e4',
                  display: 'block',
                }}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label="Supprimer cette photo"
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#111111',
                  color: '#fff',
                  fontSize: 12,
                  lineHeight: '20px',
                  textAlign: 'center',
                  border: 'none',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || values.length >= max}
        style={{
          padding: '0.65rem 1.2rem',
          borderRadius: '8px',
          border: 'none',
          background: uploading || values.length >= max ? '#6b6b6b' : '#111111',
          color: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          cursor: uploading || values.length >= max ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Envoi en cours...' : 'Ajouter des photos'}
      </button>

      {error && (
        <p style={{ color: '#111111', fontSize: '0.85rem', marginTop: '0.4rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
