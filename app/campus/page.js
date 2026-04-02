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
  Sparkles,
  X,
} from 'lucide-react';

const CONTACT_FALLBACKS = {
  administration: { contact_name: 'Nadège', contact_email: 'nadege@epsi.fr' },
  direction: { contact_name: 'Direction', contact_email: 'direction@epsi.fr' },
  pedagogie: { contact_name: 'Service pédagogie', contact_email: 'pedagogie@epsi.fr' },
  mydil: { contact_name: 'Référent Innovation', contact_email: 'mydil@epsi.fr' },
};

function normalizeLabel(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function CampusPage() {
  const [locations, setLocations] = useState([]);
  const [resources, setResources] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState('map');

  useEffect(() => {
    fetch('/api/campus')
      .then(res => res.json())
      .then(data => setLocations(data.locations || []))
      .catch(() => {});

    fetch('/api/resources')
      .then(res => res.json())
      .then(data => setResources(data.resources || []))
      .catch(() => {});
  }, []);

  const locationTypes = {
    classroom: { icon: Building, color: 'bg-blue-500', label: 'Salle de cours' },
    office: { icon: Users, color: 'bg-purple-500', label: 'Bureau' },
    cafeteria: { icon: Coffee, color: 'bg-orange-500', label: 'Espace commun' },
    library: { icon: Book, color: 'bg-emerald-500', label: 'Bibliothèque' },
    lab: { icon: FlaskConical, color: 'bg-cyan-500', label: 'Laboratoire' },
    meeting: { icon: Users, color: 'bg-pink-500', label: 'Salle de réunion' },
    other: { icon: MapPin, color: 'bg-slate-500', label: 'Autre' },
  };

  const resourceTypes = {
    library: { icon: Book, color: 'bg-emerald-500', label: 'Bibliothèque' },
    admin: { icon: Building, color: 'bg-blue-500', label: 'Administration' },
    digital_tool: { icon: Laptop, color: 'bg-purple-500', label: 'Outil numérique' },
    restaurant: { icon: Utensils, color: 'bg-orange-500', label: 'Restauration' },
    sport: { icon: Heart, color: 'bg-red-500', label: 'Sport' },
    sante: { icon: Heart, color: 'bg-pink-500', label: 'Santé' },
  };

  const getLocationContact = (location) => {
    if (location.contact_email) {
      return {
        contact_name: location.contact_name || 'Contact',
        contact_email: location.contact_email,
      };
    }

    const key = normalizeLabel(location.name);
    return CONTACT_FALLBACKS[key] || null;
  };

  const totalContacts = locations.filter(location => getLocationContact(location)).length;

  const FloorPlan = () => (
    <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 min-h-[460px]">
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.12),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(124,58,237,0.12),transparent_32%)]" />

      <svg viewBox="0 0 1000 620" className="absolute inset-0 h-full w-full">
        <rect x="0" y="0" width="1000" height="620" fill="transparent" />
        <path d="M90 85 H920" stroke="#cbd5e1" strokeWidth="14" strokeLinecap="round" />
        <path d="M90 360 H550" stroke="#cbd5e1" strokeWidth="14" strokeLinecap="round" />
        <rect x="70" y="110" width="190" height="190" rx="20" fill="#cffafe" stroke="#0891b2" strokeWidth="4" />
        <rect x="300" y="110" width="360" height="220" rx="24" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
        <rect x="700" y="110" width="220" height="290" rx="24" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="4" />
        <line x1="700" y1="205" x2="920" y2="205" stroke="#8b5cf6" strokeWidth="3" />
        <line x1="700" y1="300" x2="920" y2="300" stroke="#8b5cf6" strokeWidth="3" />
        <rect x="350" y="390" width="350" height="190" rx="24" fill="#fef3c7" stroke="#f59e0b" strokeWidth="4" />
        <text x="95" y="70" fontSize="28" fill="#0f172a" fontWeight="700">Plan 2ème étage</text>
      </svg>

      <div className="absolute inset-0">
        {locations.map(location => {
          const typeInfo = locationTypes[location.type] || locationTypes.other;
          const Icon = typeInfo.icon;
          const isActive = selectedLocation?.id === location.id;

          return (
            <button
              key={location.id}
              onClick={() => setSelectedLocation(location)}
              title={location.name}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all ${
                isActive ? 'z-20 scale-110' : 'z-10 hover:scale-110'
              }`}
              style={{
                left: `${(location.x_position || 0.5) * 100}%`,
                top: `${(location.y_position || 0.5) * 100}%`,
              }}
            >
              <span className="absolute inset-0 rounded-full animate-ping bg-epsi-blue/35" />
              <span className={`relative h-11 w-11 rounded-full ${typeInfo.color} text-white flex items-center justify-center border-4 border-white shadow-lg`}>
                <Icon className="w-5 h-5" />
              </span>
              <span className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md text-[11px] bg-slate-900 text-white whitespace-nowrap transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {location.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-epsi-blue to-epsi-purple text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Découvrir le Campus
          </h1>
          <p className="text-white/80">
            Plan interactif, ressources et services à votre disposition
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'map'
                ? 'bg-epsi-blue text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-5 h-5" />
            Plan du campus
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
              activeTab === 'resources'
                ? 'bg-epsi-blue text-white'
                : 'text-slate-600 hover:bg-slate-100'
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Zones</p>
                <p className="text-2xl font-bold text-slate-900">{locations.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Ressources</p>
                <p className="text-2xl font-bold text-slate-900">{resources.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md border border-slate-100">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Contacts</p>
                <p className="text-2xl font-bold text-slate-900">{totalContacts}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-md">
                <div className="flex items-center gap-2 text-blue-100 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wide">Astuce</span>
                </div>
                <p className="text-sm">Clique sur un point du plan pour voir infos et contact direct.</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700">Plan du 2ème étage</span>
                  </div>
                  <span className="text-sm text-slate-500">EPSI Campus</span>
                </div>

                {/* Interactive Floor Plan */}
                <div className="p-4 bg-slate-50">
                  <FloorPlan />
                </div>

                {/* Legend */}
                <div className="p-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-3">Légende</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-cyan-100 border-2 border-cyan-500"></div>
                      <span className="text-xs text-slate-600">Mydil (Lab)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-100 border-2 border-amber-500"></div>
                      <span className="text-xs text-slate-600">Espace commun</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-500"></div>
                      <span className="text-xs text-slate-600">Bureaux</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Location List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">Espaces du 2ème étage</h3>
              
              <div className="space-y-2">
                {locations.map(location => {
                  const typeInfo = locationTypes[location.type] || locationTypes.other;
                  const Icon = typeInfo.icon;
                  const locationContact = getLocationContact(location);
                  
                  return (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedLocation?.id === location.id
                          ? 'bg-epsi-light border-2 border-epsi-blue'
                          : 'bg-white hover:bg-slate-50 border-2 border-transparent'
                      } shadow-sm`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${typeInfo.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900">{location.name}</p>
                          <p className="text-xs text-slate-500">{typeInfo.label}</p>
                          {locationContact?.contact_email && (
                            <p className="text-xs text-slate-500 mt-1 truncate">{locationContact.contact_email}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </div>
        ) : (
          /* Resources Tab */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => {
              const typeInfo = resourceTypes[resource.type] || resourceTypes.admin;
              const Icon = typeInfo.icon;
              
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden card-hover"
                >
                  <div className={`h-2 ${typeInfo.color}`} />
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{resource.name}</h3>
                        <span className="text-xs text-slate-500">{typeInfo.label}</span>
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

      {/* Location Detail Modal */}
      {selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLocation(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const typeInfo = locationTypes[selectedLocation.type] || locationTypes.other;
                  const Icon = typeInfo.icon;
                  return (
                    <div className={`w-12 h-12 rounded-xl ${typeInfo.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-semibold text-slate-900">{selectedLocation.name}</h3>
                  <p className="text-sm text-slate-500">
                    {locationTypes[selectedLocation.type]?.label} • 2ème étage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {selectedLocation.description && (
              <p className="text-slate-600 mb-4">{selectedLocation.description}</p>
            )}

            {getLocationContact(selectedLocation)?.contact_email && (
              <a
                href={`mailto:${getLocationContact(selectedLocation).contact_email}`}
                className="flex items-center gap-3 text-sm text-slate-700 bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 hover:bg-blue-100 transition-colors"
              >
                <Mail className="w-4 h-4 text-epsi-blue" />
                <span>
                  Contact: {getLocationContact(selectedLocation).contact_name || 'Service'} - {getLocationContact(selectedLocation).contact_email}
                </span>
              </a>
            )}
            
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">
              <Info className="w-4 h-4" />
              <span>Visible sur le plan ci-dessus</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}