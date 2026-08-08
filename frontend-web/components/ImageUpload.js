import { useState, useRef } from 'react';

const CLOUD_NAME = 'op1wrztj';
const UPLOAD_PRESET = 'dan-online';

export default function ImageUpload({ value, onChange, label = 'Photo' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!res.ok) throw new Error('Échec de l\'upload');

      const data = await res.json();
      onChange(data.secure_url);
    } catch (err) {
      setError('Erreur lors de l\'envoi de la photo. Réessaie.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: 600,
        color: '#24312b',
        fontFamily: 'Work Sans, sans-serif',
      }}>
        {label}
      </label>

      {value && (
        <div style={{ marginBottom: '0.75rem' }}>
          <img
            src={value}
            alt="Aperçu"
            style={{
              width: '100%',
              maxWidth: '280px',
              borderRadius: '10px',
              border: '1px solid #e7ded0',
              display: 'block',
            }}
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: '0.65rem 1.2rem',
          borderRadius: '8px',
          border: 'none',
          background: uploading ? '#a9bdb2' : '#16543a',
          color: '#fbf6ee',
          fontFamily: 'Work Sans, sans-serif',
          fontWeight: 600,
          cursor: uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Envoi en cours...' : value ? 'Changer la photo' : 'Ajouter une photo'}
      </button>

      {error && (
        <p style={{ color: '#a34620', fontSize: '0.85rem', marginTop: '0.4rem' }}>
          {error}
        </p>
      )}
    </div>
  );
}
