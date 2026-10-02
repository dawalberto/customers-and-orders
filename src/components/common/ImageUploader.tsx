import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { compressImageFile } from '../../utils/imageCompressor';

interface ImageUploaderProps {
  value?: string;
  onChange: (base64Image: string | undefined) => void;
  label?: string;
  aspectRatio?: 'square' | 'wide';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Foto',
  aspectRatio = 'square',
}) => {
  const [compressing, setCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen.');
      return;
    }

    try {
      setCompressing(true);
      setErrorMessage(null);
      const compressedBase64 = await compressImageFile(file);
      onChange(compressedBase64);
    } catch (err) {
      console.error('Error compressing image:', err);
      setErrorMessage('No se pudo procesar la imagen.');
    } finally {
      setCompressing(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input value so re-taking photo works
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-full overflow-hidden">
      {label && (
        <span className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </span>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-purple-200 bg-purple-50/30 shadow-2xs">
          <div className={aspectRatio === 'square' ? 'aspect-square max-h-52 mx-auto' : 'aspect-video max-h-44'}>
            <img
              src={value}
              alt="Foto subida"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Action buttons overlay */}
          <div className="p-2 bg-white/95 backdrop-blur-xs border-t border-purple-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={compressing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-purple-50 hover:bg-purple-100 transition active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-purple-600" />
                <span>Cámara</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={compressing}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-purple-50 hover:bg-purple-100 transition active:scale-95 disabled:opacity-50"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                <span>Galería</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={compressing}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition active:scale-95 disabled:opacity-50"
              title="Eliminar foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Quitar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-purple-200 hover:border-purple-300 bg-purple-50/20 p-4 transition-colors">
          {compressing ? (
            <div className="flex flex-col items-center justify-center py-4 text-purple-600">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-xs font-medium">Comprimiendo imagen...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-500 mb-3">
                Haz una foto de los pendientes o elije de tu galería
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white shadow-2xs transition active:scale-95"
                >
                  <Camera className="w-4 h-4 text-purple-300" />
                  <span>Hacer foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-purple-50 text-slate-800 border border-purple-200 shadow-2xs transition active:scale-95"
                >
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Subir archivo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <p className="mt-1 text-xs text-red-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
};
