'use client';

import { useState, useEffect } from 'react';
import {
  MapPin,
  Book,
  Coffee,
  Laptop,
  Building,
  FlaskConical,
  Users,
  Heart,
  Utensils,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Info,
  Mail,
  GraduationCap,
  Boxes,
  X,
} from 'lucide-react';

const LOCATION_TYPES = {
  reception: { icon: Info, hex: '#2563eb', label: 'Accueil' },
  cafeteria: { icon: Coffee, hex: '#f59e0b', label: 'Cafétéria' },
  restaurant: { icon: Utensils, hex: '#ea580c', label: 'Restauration' },
  coworking: { icon: Users, hex: '#0ea5e9', label: 'Espace commun' },
  amphitheater: { icon: GraduationCap, hex: '#8b5cf6', label: 'Amphithéâtre' },
  lab: { icon: FlaskConical, hex: '#06b6d4', label: 'Laboratoire' },
  classroom: { icon: Book, hex: '#3b82f6', label: 'Salle de cours' },
  office: { icon: Building, hex: '#6366f1', label: 'Bureau' },
  library: { icon: Book, hex: '#10b981', label: 'Bibliothèque' },
  meeting: { icon: Users, hex: '#ec4899', label: 'Salle de réunion' },
  other: { icon: MapPin, hex: '#64748b', label: 'Espace' },
};

const RESOURCE_TYPES = {
  library: { icon: Book, color: 'bg-emerald-500', label: 'Bibliothèque' },
  admin: { icon: Building, color: 'bg-blue-500', label: 'Administration' },
  digital_tool: { icon: Laptop, color: 'bg-indigo-500', label: 'Outil numérique' },
  restaurant: { icon: Utensils, color: 'bg-orange-500', label: 'Restauration' },
  sport: { icon: Heart, color: 'bg-red-500', label: 'Sport' },
  sante: { icon: Heart, color: 'bg-pink-500', label: 'Santé' },
};

const FLOORS = [
  { id: 0, label: 'Rez-de-chaussée', short: 'RDC', z: 0 },
  { id: 2, label: '2ᵉ étage', short: '2ᵉ', z: 215 },
];

function floorLabel(floor) {
  const f = FLOORS.find((x) => x.id === (floor ?? 0));
  return f ? f.label : 'Campus';
}

function typeInfo(type) {
  return LOCATION_TYPES[type] || LOCATION_TYPES.other;
}

/* =====================================================
   3D building plan
   ===================================================== */
function CampusPlan({ locations, selectedId, onSelect }) {
  const [activeFloor, setActiveFloor] = useState('all');

  const ROOM_W = 0.26;
  const ROOM_H = 0.27;

  return (
    <div>
      {/* Floor selector */}
      <div className="flex flex-wrap items-center gap-2 mb-2 px-4 pt-4">
        <span className="text-xs uppercase tracking-wider text-slate-500 mr-1">Vue</span>
        {[{ id: 'all', label: 'Bâtiment' }, ...FLOORS.map((f) => ({ id: f.id, label: f.label }))].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveFloor(opt.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeFloor === opt.id
                ? 'bg-epsi-blue text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="campus-scene">
        <div
          className={`campus-stage${activeFloor !== 'all' ? ' single-floor' : ''}`}
          style={{ '--stage-scale': activeFloor === 'all' ? 1 : 1.08 }}
        >
          {FLOORS.map((floor) => {
            const focusing = activeFloor !== 'all';
            const dimmed = focusing && activeFloor !== floor.id;
            const z = focusing ? 90 : floor.z;
            const rooms = locations.filter((l) => (l.floor ?? 0) === floor.id);
            return (
              <div
                key={floor.id}
                className={`campus-floor${dimmed ? ' is-dimmed' : ''}`}
                style={{ transform: `translateZ(${z}px)` }}
              >
                <div className="campus-slab" />
                <span className="campus-floor-tag">
                  <Layers className="w-3 h-3" />
                  {floor.short}
                </span>
                {rooms.map((loc) => {
                  const t = typeInfo(loc.type);
                  const Icon = t.icon;
                  const active = selectedId === loc.id;
                  const x = loc.x_position ?? 0.5;
                  const y = loc.y_position ?? 0.5;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => onSelect(loc)}
                      title={loc.name}
                      className={`campus-room${active ? ' is-active' : ''}`}
                      style={{
                        left: `${(x - ROOM_W / 2) * 100}%`,
                        top: `${(y - ROOM_H / 2) * 100}%`,
                        width: `${ROOM_W * 100}%`,
                        height: `${ROOM_H * 100}%`,
                        '--room-color': t.hex,
                        '--room-fill': `${t.hex}26`,
                        '--room-active': `${t.hex}3d`,
                        '--room-ring': `${t.hex}80`,
                      }}
                    >
                      <span className="campus-room-fill" />
                      <span className="campus-badge">
                        <span className="campus-badge-dot" style={{ background: t.hex }}>
                          <Icon className="w-4 h-4" />
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4 pt-1 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-2">Légende</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {['reception', 'cafeteria', 'restaurant', 'coworking', 'amphitheater', 'lab', 'office'].map((key) => {
            const t = LOCATION_TYPES[key];
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ background: t.hex }} />
                <span className="text-xs text-slate-600">{t.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CampusPage() {
  const [locations, setLocations] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    fetch('/api/campus')
      .then((res) => res.json())
      .then((data) => setLocations(data.locations || []))
      .catch(() => {});

    fetch('/api/resources')
      .then((res) => res.json())
      .then((data) => setResources(data.resources || []))
      .catch(() => {});
  }, []);

  const getContact = (location) => {
    if (location?.contact_email) {
      return { name: location.contact_name || 'Contact', email: location.contact_email };
    }
    return null;
  };

  const totalContacts = locations.filter((l) => getContact(l)).length;
  const floorsPresent = new Set(locations.map((l) => l.floor ?? 0)).size;

  const stats = [
    { label: 'Espaces', value: locations.length },
    { label: 'Niveaux', value: floorsPresent },
    { label: 'Ressources', value: resources.length },
    { label: 'Contacts', value: totalContacts },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="page-hero">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <span className="eyebrow mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="w-6 h-px bg-white/40" /> Campus EPSI
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">Découvrir le Campus</h1>
          <p className="text-white/70">Plan 3D interactif, ressources et services à votre disposition.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-0">
        <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'map' ? 'bg-epsi-blue text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-5 h-5" />
            Plan du campus
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'resources' ? 'bg-epsi-blue text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Laptop className="w-5 h-5" />
            Ressources & Services
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'map' ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-md border border-slate-200">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-data font-semibold text-slate-900">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* 3D plan */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-5 h-5 text-epsi-blue" />
                      <span className="font-medium text-slate-800">Plan 3D du bâtiment</span>
                    </div>
                    <span className="text-sm text-slate-500">Cliquez sur un espace</span>
                  </div>
                  <CampusPlan
                    locations={locations}
                    selectedId={selectedLocation?.id}
                    onSelect={setSelectedLocation}
                  />
                </div>
              </div>

              {/* Sidebar — spaces grouped by floor */}
              <div className="space-y-6">
                {FLOORS.map((floor) => {
                  const rooms = locations.filter((l) => (l.floor ?? 0) === floor.id);
                  if (rooms.length === 0) return null;
                  return (
                    <div key={floor.id}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-6 h-6 rounded-md bg-epsi-blue text-white text-xs font-data font-semibold flex items-center justify-center">
                          {floor.short}
                        </span>
                        <h3 className="font-semibold text-slate-900">{floor.label}</h3>
                        <span className="text-xs text-slate-400">{rooms.length} espaces</span>
                      </div>
                      <div className="space-y-2">
                        {rooms.map((loc) => {
                          const t = typeInfo(loc.type);
                          const Icon = t.icon;
                          return (
                            <button
                              key={loc.id}
                              onClick={() => setSelectedLocation(loc)}
                              className={`w-full p-3 rounded-xl text-left transition-all shadow-sm border-2 ${
                                selectedLocation?.id === loc.id
                                  ? 'bg-epsi-light border-epsi-blue'
                                  : 'bg-white hover:bg-slate-50 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                                  style={{ background: t.hex }}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">{loc.name}</p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    {t.label}
                                    {loc.hours && (
                                      <>
                                        <span className="text-slate-300">·</span>
                                        <span className="truncate">{loc.hours}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Resources Tab */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => {
              const t = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.admin;
              const Icon = t.icon;
              return (
                <div key={resource.id} className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden card-hover">
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${t.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{resource.name}</h3>
                        <span className="text-xs text-slate-500">{t.label}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">{resource.description}</p>
                    {resource.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <MapPin className="w-4 h-4" />
                        {resource.location}
                      </div>
                    )}
                    {resource.hours && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                        <Clock className="w-4 h-4" />
                        {resource.hours}
                      </div>
                    )}
                    {resource.link && (
                      <a
                        href={resource.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-epsi-blue hover:underline"
                      >
                        Accéder au service
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Location detail modal */}
      {selectedLocation && (
        <div className="modal-backdrop flex items-center justify-center p-4" onClick={() => setSelectedLocation(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const t = typeInfo(selectedLocation.type);
              const Icon = t.icon;
              const contact = getContact(selectedLocation);
              return (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ background: t.hex }}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{selectedLocation.name}</h3>
                        <p className="text-sm text-slate-500">
                          {t.label} · {floorLabel(selectedLocation.floor)}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedLocation(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  {selectedLocation.description && (
                    <p className="text-slate-600 mb-4">{selectedLocation.description}</p>
                  )}

                  {selectedLocation.hours && (
                    <div className="flex items-center gap-3 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mb-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Horaires : {selectedLocation.hours}</span>
                    </div>
                  )}

                  {contact && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 text-sm text-slate-700 bg-blue-50 border border-blue-100 rounded-lg p-3 hover:bg-blue-100 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-epsi-blue" />
                      <span>
                        {contact.name} — {contact.email}
                      </span>
                    </a>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
