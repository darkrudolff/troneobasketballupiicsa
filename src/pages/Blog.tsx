import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';

// URL de tu Google Apps Script de la Galería (API de Drive)
const DRIVE_GALLERY_API_URL = 'https://script.google.com/macros/s/AKfycbzJwREzzV8UaWgtC0qHb6NR_SJ5CA9MqhtIO8zMSZvp-TSBR93XFQBa0xGqhiIHoHjI/exec';

// URL de tu Google Apps Script para guardar registros en Google Sheets
const GOOGLE_SCRIPT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx279lbXsP32ZTUM6z-Ao6_1UEhPj_ViCQ79uPXCbnw8epduiqgbOe2Nlj8yHZ5rkLb/exec';


interface FormData {
  teamName: string;
  captainName: string;
  email: string;
  phone: string;
  category: string;
  numPlayers: number;
}

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

interface GalleryImage {
  id: string;
  driveId: string;
  title: string;
  description?: string;
}

// Colección de fotos de Unsplash (Básquetbol) para usar de respaldo o pruebas
const UNSPLASH_FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=800&auto=format&fit=crop',
];

export default function TournamentLanding(): React.ReactElement {
  // Estado de la Galería Dinámica
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Ref para el contenedor del carrusel en móvil
  const carouselRef = useRef<HTMLDivElement>(null);

  // Estado del Formulario
  const [formData, setFormData] = useState<FormData>({
    teamName: '',
    captainName: '',
    email: '',
    phone: '',
    category: 'Varonil Libre',
    numPlayers: 5,
  });

  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [formMessage, setFormMessage] = useState<StatusMessage | null>(null);

  // Estado del Modal Lightbox
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // Carga automática de la Galería
  useEffect(() => {
    async function fetchDriveGallery() {
      try {
        setLoadingGallery(true);
        const res = await fetch(DRIVE_GALLERY_API_URL);
        const json = await res.json();

        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          setGallery(json.data);
        } else {
          console.warn('Drive retornó una lista vacía o con errores, cargando Unsplash...');
          loadUnsplashFallback();
        }
      } catch (err) {
        console.error('Error al conectar con Drive API, usando Unsplash:', err);
        loadUnsplashFallback();
      } finally {
        setLoadingGallery(false);
      }
    }

    fetchDriveGallery();
  }, []);

  // Carga imágenes por defecto desde Unsplash si falla la API
  const loadUnsplashFallback = () => {
    const fallbackData: GalleryImage[] = UNSPLASH_FALLBACK_PHOTOS.map((url, index) => ({
      id: `unsplash-${index}`,
      driveId: url, // Guarda la URL directa de Unsplash
      title: `Torneo Basket - Foto ${index + 1}`,
      description: 'Imagen destacada de las jornadas del torneo de básquetbol.',
    }));
    setGallery(fallbackData);
  };

  // Detectar el índice de la foto activa al hacer scroll en móvil
  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  // Función para desplazar manualmente el carrusel en móvil
  const scrollToIndex = (index: number) => {
    if (!carouselRef.current) return;
    const clientWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({
      left: clientWidth * index,
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoadingForm(true);
    setFormMessage(null);

    try {
      const response = await fetch(GOOGLE_SCRIPT_SHEETS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error de conexión');

      setFormMessage({
        type: 'success',
        text: '¡Registro exitoso! Los datos del equipo fueron guardados.',
      });

      setFormData({
        teamName: '',
        captainName: '',
        email: '',
        phone: '',
        category: 'Varonil Libre',
        numPlayers: 5,
      });
    } catch (error) {
      console.error(error);
      setFormMessage({
        type: 'error',
        text: 'No se pudo completar el registro. Inténtalo nuevamente.',
      });
    } finally {
      setLoadingForm(false);
    }
  };

  // Formatear la URL de la imagen (Soporta Google Drive y Unsplash)
  const getImageUrl = (driveIdOrUrl: string) => {
    if (driveIdOrUrl.startsWith('http://') || driveIdOrUrl.startsWith('https://')) {
      return driveIdOrUrl;
    }
    // Formato de proxy directo para Google Drive
    return `https://lh3.googleusercontent.com/d/${driveIdOrUrl}`;
  };

  // Manejador de error individual de imagen (Si la foto de Drive falla, la cambia por Unsplash)
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, index: number) => {
    const target = e.currentTarget;
    const fallbackUrl = UNSPLASH_FALLBACK_PHOTOS[index % UNSPLASH_FALLBACK_PHOTOS.length];
    
    // Evita bucles infinitos si Unsplash también fallara
    if (target.src !== fallbackUrl) {
      target.src = fallbackUrl;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* HERO SECTION */}
      <header className="relative py-16 px-4 sm:px-8 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>🏀</span>
            <span>Comunidad Deportiva UPIICSA</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            Torneo de Básquetbol <span className="text-orange-500">UPIICSA</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            Inscribe a tu equipo y consulta la galería de fotos en tiempo real.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-20">

        {/* ------------------------------------------------------------------ */}
        {/* GALERÍA RESPONSIVA: CARRUSEL COMPACTO EN MÓVIL / GRID DESKTOP */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 Galería del Torneo
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Fotos e imágenes del torneo en vivo
              </p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 self-start sm:self-auto flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Actualizado
            </span>
          </div>

          {/* Skeleton Loader */}
          {loadingGallery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 sm:h-72 rounded-2xl bg-slate-900 border border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-slate-400 text-sm">No hay imágenes disponibles por el momento.</p>
            </div>
          ) : (
            <div className="relative">
              
              {/* CARRUSEL / GRID */}
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="
                  flex sm:grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6
                  overflow-x-auto sm:overflow-x-visible
                  snap-x snap-mandatory sm:snap-none
                  scroll-smooth no-scrollbar
                  -mx-4 px-10 sm:mx-0 sm:px-0 pb-4 sm:pb-0
                "
              >
                {gallery.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className="
                      min-w-[65vw] sm:min-w-0
                      h-56 sm:h-72
                      snap-center shrink-0 sm:shrink
                      group relative rounded-2xl overflow-hidden
                      bg-slate-900/90 border border-slate-800 cursor-pointer shadow-lg
                      transition-all duration-300 hover:border-orange-500/50 hover:shadow-orange-500/10
                      flex items-center justify-center p-2 sm:p-0
                    "
                  >
                    <img
                      src={getImageUrl(img.driveId)}
                      alt={img.title}
                      onError={(e) => handleImageError(e, idx)}
                      className="w-full h-full object-contain sm:object-cover transition-transform duration-500 group-hover:scale-105 rounded-xl sm:rounded-none"
                      loading="lazy"
                    />
                    
                    
                    {/* Sombra para el texto */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-90 transition-opacity pointer-events-none" />
                    
                    {/* Título y Descripción */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 pointer-events-none">
                      <h3 className="text-xs sm:text-sm font-bold text-white capitalize group-hover:text-orange-400 transition-colors line-clamp-1">
                        {img.title}
                      </h3>
                      {img.description && (
                        <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-1 sm:line-clamp-2 leading-tight">
                          {img.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CONTROLES MÓVILES */}
              {gallery.length > 1 && (
                <div className="flex sm:hidden items-center justify-between mt-3 px-2">
                  <button
                    onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                    disabled={activeIndex === 0}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 active:scale-95 transition text-xs font-semibold"
                    aria-label="Anterior"
                  >
                    ← Ant
                  </button>

                  <div className="flex items-center gap-1.5">
                    {gallery.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeIndex === idx
                            ? 'w-5 bg-orange-500'
                            : 'w-2 bg-slate-800 hover:bg-slate-700'
                        }`}
                        aria-label={`Ir a foto ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => scrollToIndex(Math.min(gallery.length - 1, activeIndex + 1))}
                    disabled={activeIndex === gallery.length - 1}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 active:scale-95 transition text-xs font-semibold"
                    aria-label="Siguiente"
                  >
                    Sig →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FORMULARIO DE REGISTRO */}
        {/* ------------------------------------------------------------------ */}
        <section className="max-w-xl mx-auto">
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Registro de Equipo</h2>
              <p className="text-slate-400 text-sm mt-1">
                Llena el formulario para registrar a tu equipo en Google Sheets
              </p>
            </div>

            {formMessage && (
              <div
                className={`p-4 rounded-xl mb-6 text-sm font-medium border flex items-center gap-3 ${
                  formMessage.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                <span>{formMessage.type === 'success' ? '✓' : '✕'}</span>
                <span>{formMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Equipo
                </label>
                <input
                  type="text"
                  name="teamName"
                  required
                  value={formData.teamName}
                  onChange={handleChange}
                  placeholder="Ej. Toros UPIICSA"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre del Capitán
                </label>
                <input
                  type="text"
                  name="captainName"
                  required
                  value={formData.captainName}
                  onChange={handleChange}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="capitan@ipn.mx"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="5512345678"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm text-slate-200 transition"
                  >
                    <option value="Varonil Libre">Varonil Libre</option>
                    <option value="Femenil Libre">Femenil Libre</option>
                    <option value="Mixto">Mixto</option>
                    <option value="Inter-UPIICSA">Inter-UPIICSA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    N° de Jugadores
                  </label>
                  <input
                    type="number"
                    name="numPlayers"
                    min={3}
                    max={15}
                    value={formData.numPlayers}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingForm}
                className="w-full mt-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingForm ? 'Guardando...' : 'Completar Registro'}
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-3 py-1 rounded-lg border border-slate-700"
            >
              ✕ Cerrar
            </button>
            <img
              src={getImageUrl(selectedImage.driveId)}
              alt={selectedImage.title}
              onError={(e) => handleImageError(e, 0)}
              className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl border border-slate-800"
            />
            <div className="mt-4 text-center max-w-xl">
              <h4 className="text-slate-100 font-bold text-lg capitalize">
                {selectedImage.title}
              </h4>
              {selectedImage.description && (
                <p className="text-slate-300 text-sm mt-1 leading-relaxed">
                  {selectedImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}