'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  back1: File | null
  back2: File | null
  front: File | null
  onPhotosChange: (back1: File | null, back2: File | null, front: File | null) => void
}

export default function PhotosStep({ back1, back2, front, onPhotosChange }: Props) {
  const [preview1, setPreview1] = useState<string | null>(null)
  const [preview2, setPreview2] = useState<string | null>(null)
  const [previewFront, setPreviewFront] = useState<string | null>(null)
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const refFront = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (preview1) URL.revokeObjectURL(preview1)
      if (preview2) URL.revokeObjectURL(preview2)
      if (previewFront) URL.revokeObjectURL(previewFront)
    }
  }, [])

  function pickBack1(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (preview1) URL.revokeObjectURL(preview1)
    setPreview1(file ? URL.createObjectURL(file) : null)
    onPhotosChange(file, back2, front)
  }

  function pickBack2(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (preview2) URL.revokeObjectURL(preview2)
    setPreview2(file ? URL.createObjectURL(file) : null)
    onPhotosChange(back1, file, front)
  }

  function pickFront(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (previewFront) URL.revokeObjectURL(previewFront)
    setPreviewFront(file ? URL.createObjectURL(file) : null)
    onPhotosChange(back1, back2, file)
  }

  return (
    <div>
      <h2 className="text-2xl mb-1" style={{ fontFamily: 'var(--font-playfair), serif', color: 'var(--ivory)' }}>
        Your photos
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--ivory-dim)' }}>
        Two back-side photos for members · one face photo revealed only when you choose
      </p>
      <div
        className="mb-6 h-px"
        style={{ background: 'linear-gradient(to right, var(--antique-gold), transparent)' }}
      />

      {/* Back photos */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium tracking-wider uppercase" style={{ color: 'var(--antique-gold)' }}>
            Back-side photos
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(201,168,76,0.1)', color: 'var(--antique-gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
            Visible to members
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--ivory-dim)' }}>
          Share a back, silhouette, or side profile — your face stays private here.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <PhotoBox
            label="Photo 1"
            preview={preview1}
            inputRef={ref1}
            onChange={pickBack1}
            blurred={false}
          />
          <PhotoBox
            label="Photo 2"
            preview={preview2}
            inputRef={ref2}
            onChange={pickBack2}
            blurred={false}
          />
        </div>
      </div>

      {/* Divider */}
      <div
        className="my-6 h-px"
        style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.2), transparent)' }}
      />

      {/* Reveal / front photo */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium tracking-wider uppercase" style={{ color: 'var(--antique-gold)' }}>
            Your reveal photo
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(14,26,53,0.8)', color: 'var(--ivory-dim)', border: '1px solid rgba(201,168,76,0.15)' }}>
            🔒 Hidden until revealed
          </span>
        </div>
        <p className="text-xs mb-4" style={{ color: 'var(--ivory-dim)' }}>
          Your face photo. Only visible when you click "Reveal Photo" on someone's profile — and they are notified instantly.
        </p>

        <PhotoBox
          label="Face photo"
          preview={previewFront}
          inputRef={refFront}
          onChange={pickFront}
          blurred={true}
          fullWidth
        />
      </div>
    </div>
  )
}

function PhotoBox({
  label,
  preview,
  inputRef,
  onChange,
  blurred,
  fullWidth,
}: {
  label: string
  preview: string | null
  inputRef: React.RefObject<HTMLInputElement | null>
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  blurred: boolean
  fullWidth?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-xl overflow-hidden transition-all duration-200 ${fullWidth ? 'w-full' : 'w-full'}`}
      style={{
        height: fullWidth ? '180px' : '140px',
        border: preview ? '1px solid var(--antique-gold)' : '1px dashed rgba(201,168,76,0.3)',
        backgroundColor: 'var(--oxford-navy)',
      }}
    >
      {preview ? (
        <>
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
            style={blurred ? { filter: 'blur(12px)', transform: 'scale(1.1)' } : {}}
          />
          {blurred && (
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ backgroundColor: 'rgba(14,26,53,0.5)' }}>
              <span className="text-2xl mb-1">🔒</span>
              <span className="text-xs font-medium" style={{ color: 'var(--ivory)' }}>Hidden</span>
            </div>
          )}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium"
            style={{ backgroundColor: 'rgba(14,26,53,0.85)', color: 'var(--antique-gold)' }}>
            ✓ Uploaded
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2">
          <span className="text-2xl">{blurred ? '🔒' : '📷'}</span>
          <span className="text-xs" style={{ color: 'var(--ivory-dim)' }}>
            {label}
          </span>
          <span className="text-xs" style={{ color: 'rgba(189,181,166,0.5)' }}>
            Tap to upload
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </button>
  )
}
