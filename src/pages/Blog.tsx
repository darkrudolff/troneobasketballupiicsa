import React, { useState, useEffect, useRef, ChangeEvent, FormEvent } from 'react';

// URL de tu Google Apps Script de la Galería (API de Drive)
const DRIVE_GALLERY_API_URL = 'https://script.google.com/macros/s/AKfycbzJwREzzV8UaWgtC0qHb6NR_SJ5CA9MqhtIO8zMSZvp-TSBR93XFQBa0xGqhiIHoHjI/exec';

// URL de tu Google Apps Script para guardar registros en Google Sheets
const GOOGLE_SCRIPT_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbx279lbXsP32ZTUM6z-Ao6_1UEhPj_ViCQ79uPXCbnw8epduiqgbOe2Nlj8yHZ5rkLb/exec';

interface FormData {
  coachName: string;
  managerName: string;
  email: string;
  phone: string;
  branch: string;
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

const UNSPLASH_FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?q=80&w=800&auto=format&fit=crop',
];

export default function TournamentLanding(): React.ReactElement {
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState<boolean>(true);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const carouselRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    coachName: '',
    managerName: '',
    email: '',
    phone: '',
    branch: 'Varonil',
  });

  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [formMessage, setFormMessage] = useState<StatusMessage | null>(null);

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    async function fetchDriveGallery() {
      try {
        setLoadingGallery(true);
        const res = await fetch(DRIVE_GALLERY_API_URL);
        const json = await res.json();

        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          setGallery(json.data);
        } else {
          loadUnsplashFallback();
        }
      } catch (err) {
        loadUnsplashFallback();
      } finally {
        setLoadingGallery(false);
      }
    }

    fetchDriveGallery();
  }, []);

  const loadUnsplashFallback = () => {
    const fallbackData: GalleryImage[] = UNSPLASH_FALLBACK_PHOTOS.map((url, index) => ({
      id: `unsplash-${index}`,
      driveId: url,
      title: `Torneo Basket - Foto ${index + 1}`,
      description: 'Imagen destacada de las jornadas del torneo de básquetbol.',
    }));
    setGallery(fallbackData);
  };

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        text: '¡Registro exitoso! Los documentos adjuntos fueron enviados al correo proporcionado.',
      });

      setFormData({
        coachName: '',
        managerName: '',
        email: '',
        phone: '',
        branch: 'Varonil',
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

  const getImageUrl = (driveIdOrUrl: string) => {
    if (driveIdOrUrl.startsWith('http://') || driveIdOrUrl.startsWith('https://')) {
      return driveIdOrUrl;
    }
    return `https://lh3.googleusercontent.com/d/${driveIdOrUrl}`;
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, index: number) => {
    const target = e.currentTarget;
    const fallbackUrl = UNSPLASH_FALLBACK_PHOTOS[index % UNSPLASH_FALLBACK_PHOTOS.length];
    if (target.src !== fallbackUrl) {
      target.src = fallbackUrl;
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-neutral-100 font-sans selection:bg-[#BC955C] selection:text-black">
      
      {/* BARRA SUPERIOR INSTITUCIONAL CON LOGOS MÁS GRANDES */}
      <div className="bg-[#4A121A] text-white py-4 px-6 border-b border-[#BC955C]">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
          
          {/* Logo Izquierdo: IPN */}
          <div className="flex items-center">
            <img 
              src="https://ipn.mx/assets/files/main/img/template/header/logo-ipn-horizontal.svg" 
              alt="Logo IPN" 
              className="h-12 sm:h-16 md:h-28 w-auto object-contain brightness-0 invert transition-all"
            />
          </div>

          {/* Texto central en pantallas medianas / grandes */}
          <div className="text-xs sm:text-sm text-[#BC955C] font-bold tracking-widest uppercase text-center hidden md:block">
            CONVOCATORIA OFICIAL DEPORTIVA 2026
          </div>

          {/* Logo Derecho: UPIICSA */}
          <div className="flex items-center">
            <img 
              src="https://upiicsa.ipn.mx/assets/files/upiicsa/img/inicio/icon-upiicsa.png" 
              alt="Logo UPIICSA" 
              className="h-14 sm:h-18 md:h-28 w-auto object-contain drop-shadow-lg transition-all"
            />
          </div>

        </div>
      </div>

      {/* HERO HEADER */}
      <header className="relative py-14 px-4 sm:px-8 bg-gradient-to-b from-[#6B1D2F] to-[#4A121A] text-center border-b-4 border-[#BC955C] shadow-xl">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BC955C]/20 border border-[#BC955C] text-[#D4C19C] text-xs font-bold uppercase tracking-widest mb-4">
            <span>🏀</span>
            <span>Comunidad Deportiva UPIICSA</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3 uppercase">
            Torneo de Básquetbol <span className="text-[#BC955C]">UPIICSA</span>
          </h1>
          <p className="text-neutral-200 text-base sm:text-lg max-w-2xl mx-auto font-light">
            Inscribe a tu equipo, consulta la galería oficial y recibe el reglamento e información directo en tu correo.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 space-y-20">

        {/* GALERÍA */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2 border-b border-neutral-800 pb-4">
            <div>
              <h2 className="text-2xl font-black uppercase text-white flex items-center gap-2 tracking-wide">
                Galería del Torneo
              </h2>
              <p className="text-neutral-400 text-sm mt-0.5">
                Fotografías y momentos destacados de las jornadas deportivas
              </p>
            </div>
            <span className="text-xs text-[#D4C19C] bg-[#BC955C]/10 px-3 py-1.5 rounded-md border border-[#BC955C]/30 self-start sm:self-auto flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#BC955C] animate-pulse"></span>
              En Vivo
            </span>
          </div>

          {loadingGallery ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-56 sm:h-72 rounded-xl bg-neutral-900 border border-neutral-800 animate-pulse" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <p className="text-neutral-400 text-sm">No hay imágenes disponibles por el momento.</p>
            </div>
          ) : (
            <div className="relative">
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
                      group relative rounded-xl overflow-hidden
                      bg-neutral-900 border border-neutral-800 cursor-pointer shadow-lg
                      transition-all duration-300 hover:border-[#BC955C] hover:shadow-[#BC955C]/20
                      flex items-center justify-center p-2 sm:p-0
                    "
                  >
                    <img
                      src={getImageUrl(img.driveId)}
                      alt={img.title}
                      onError={(e) => handleImageError(e, idx)}
                      className="w-full h-full object-contain sm:object-cover transition-transform duration-500 group-hover:scale-105 rounded-lg sm:rounded-none"
                      loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 transition-opacity pointer-events-none" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 pointer-events-none">
                      <h3 className="text-xs sm:text-sm font-bold text-white capitalize group-hover:text-[#D4C19C] transition-colors line-clamp-1">
                        {img.title}
                      </h3>
                      {img.description && (
                        <p className="text-[11px] sm:text-xs text-neutral-300 mt-0.5 line-clamp-1 sm:line-clamp-2 leading-tight font-light">
                          {img.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {gallery.length > 1 && (
                <div className="flex sm:hidden items-center justify-between mt-3 px-2">
                  <button
                    onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                    disabled={activeIndex === 0}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 disabled:opacity-30 active:scale-95 transition text-xs font-semibold"
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
                            ? 'w-5 bg-[#BC955C]'
                            : 'w-2 bg-neutral-800 hover:bg-neutral-700'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => scrollToIndex(Math.min(gallery.length - 1, activeIndex + 1))}
                    disabled={activeIndex === gallery.length - 1}
                    className="px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 disabled:opacity-30 active:scale-95 transition text-xs font-semibold"
                  >
                    Sig →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* FORMULARIO */}
        <section className="max-w-xl mx-auto">
          <div className="bg-neutral-900/90 rounded-2xl p-6 sm:p-8 border border-neutral-800 shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6B1D2F] via-[#BC955C] to-[#6B1D2F]" />

            <div className="text-center mb-8">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#BC955C]">Inscripción de Equipos</span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-1">Registro Oficial</h2>
              <p className="text-neutral-400 text-sm mt-1">
                Completa tus datos para registrar el equipo y recibir los documentos por correo.
              </p>
            </div>

            {formMessage && (
              <div
                className={`p-4 rounded-xl mb-6 text-sm font-medium border flex items-center gap-3 ${
                  formMessage.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-950/40 text-rose-400 border-rose-500/40'
                }`}
              >
                <span className="font-bold">{formMessage.type === 'success' ? '✓' : '✕'}</span>
                <span>{formMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* NOMBRE DE ENTRENADOR */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Nombre del Entrenador
                </label>
                <input
                  type="text"
                  name="coachName"
                  required
                  value={formData.coachName}
                  onChange={handleChange}
                  placeholder="Ej. Roberto Gómez"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-[#BC955C] focus:border-transparent focus:outline-none text-sm transition"
                />
              </div>

              {/* ENCARGADO DEL EQUIPO */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Encargado del Equipo
                </label>
                <input
                  type="text"
                  name="managerName"
                  required
                  value={formData.managerName}
                  onChange={handleChange}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-[#BC955C] focus:border-transparent focus:outline-none text-sm transition"
                />
              </div>

              {/* EMAIL Y TELÉFONO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="entrenador@ejemplo.com"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-[#BC955C] focus:border-transparent focus:outline-none text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    WhatsApp / Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="5512345678"
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-[#BC955C] focus:border-transparent focus:outline-none text-sm transition"
                  />
                </div>
              </div>

              {/* RAMA (VARONIL / FEMENIL) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Rama
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:ring-2 focus:ring-[#BC955C] focus:border-transparent focus:outline-none text-sm text-neutral-200 transition"
                >
                  <option value="Varonil">Varonil</option>
                  <option value="Femenil">Femenil</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loadingForm}
                className="w-full mt-6 bg-[#6B1D2F] hover:bg-[#800020] text-white font-bold py-3.5 rounded-xl border border-[#BC955C]/40 shadow-lg transition duration-150 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
              >
                {loadingForm ? 'Guardando Registro...' : 'Completar Registro 🏀'}
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
              className="absolute -top-12 right-0 text-neutral-300 hover:text-white text-xs font-bold bg-[#6B1D2F] px-3 py-1.5 rounded-lg border border-[#BC955C]"
            >
              ✕ Cerrar
            </button>
            <img
              src={getImageUrl(selectedImage.driveId)}
              alt={selectedImage.title}
              onError={(e) => handleImageError(e, 0)}
              className="max-w-full max-h-[75vh] rounded-xl object-contain shadow-2xl border border-neutral-800"
            />
            <div className="mt-4 text-center max-w-xl">
              <h4 className="text-white font-bold text-lg capitalize">
                {selectedImage.title}
              </h4>
              {selectedImage.description && (
                <p className="text-neutral-300 text-sm mt-1 leading-relaxed font-light">
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