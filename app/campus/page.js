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
  X,
} from 'lucide-react';

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

  // Plan SVG du 2ème étage basé sur le dessin fourni
  const FloorPlanSVG = () => (
    <svg viewBox="0 0 800 500" className="w-full h-full" style={{ minHeight: '400px' }}>
      {/* Fond */}
      <rect x="0" y="0" width="800" height="500" fill="#f8fafc" />
      
      {/* Titre */}
      <text x="30" y="35" fontSize="18" fontWeight="bold" fill="#334155">2ème étage</text>
      
      {/* === PARTIE HAUTE === */}
      
      {/* Couloir horizontal haut */}
      <rect x="50" y="60" width="700" height="8" fill="#cbd5e1" />
      
      {/* Mydil - bloc gauche */}
      <rect x="50" y="70" width="120" height="120" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="3" rx="4" />
      <rect x="50" y="70" width="120" height="50" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="5,5" />
      
      {/* Espace commun haut - grand bloc central */}
      <rect x="200" y="70" width="280" height="150" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" rx="4" />
      
      {/* Bloc administration/direction/pédagogie - droite */}
      <g>
        {/* Conteneur principal */}
        <rect x="580" y="70" width="170" height="200" fill="#f3e8ff" stroke="#a855f7" strokeWidth="3" rx="4" />
        {/* Séparateurs horizontaux */}
        <line x1="580" y1="130" x2="750" y2="130" stroke="#a855f7" strokeWidth="2" />
        <line x1="580" y1="190" x2="750" y2="190" stroke="#a855f7" strokeWidth="2" />
      </g>
      
      {/* === PARTIE BASSE === */}
      
      {/* Couloir diagonal / espace */}
      <rect x="50" y="280" width="200" height="8" fill="#cbd5e1" />
      
      {/* Espace commun bas */}
      <rect x="250" y="300" width="280" height="150" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3" rx="4" />
      {/* Ouverture/porte */}
      <rect x="530" y="350" width="10" height="50" fill="#f59e0b" />
      
      {/* Murs extérieurs stylisés */}
      <path d="M 50 60 L 50 200 L 170 200 L 170 280 L 50 280 L 50 290" 
            fill="none" stroke="#64748b" strokeWidth="4" />
      
      {/* Labels des zones */}
      <text x="110" y="140" fontSize="14" fontWeight="600" fill="#0369a1" textAnchor="middle">Mydil</text>
      
      <text x="340" y="155" fontSize="14" fontWeight="600" fill="#b45309" textAnchor="middle">Espace commun</text>
      
      <text x="665" y="105" fontSize="12" fontWeight="600" fill="#7c3aed" textAnchor="middle">Administration</text>
      <text x="665" y="165" fontSize="12" fontWeight="600" fill="#7c3aed" textAnchor="middle">Direction</text>
      <text x="665" y="225" fontSize="12" fontWeight="600" fill="#7c3aed" textAnchor="middle">Pédagogie</text>
      
      <text x="390" y="385" fontSize="14" fontWeight="600" fill="#b45309" textAnchor="middle">Espace commun</text>
      
      {/* Icônes décoratives */}
      {/* Tables dans espace commun haut */}
      <circle cx="280" cy="130" r="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="340" cy="160" r="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="400" cy="130" r="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
      
      {/* Tables dans espace commun bas */}
      <circle cx="320" cy="360" r="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="390" cy="390" r="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
      <circle cx="460" cy="360" r="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="1" />
      
      {/* Bureaux dans administration */}
      <rect x="600" y="85" width="40" height="25" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1" rx="2" />
      <rect x="600" y="145" width="40" height="25" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1" rx="2" />
      <rect x="600" y="205" width="40" height="25" fill="#e9d5ff" stroke="#a855f7" strokeWidth="1" rx="2" />
      
      {/* Postes dans Mydil */}
      <rect x="70" y="100" width="30" height="20" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" rx="2" />
      <rect x="70" y="130" width="30" height="20" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" rx="2" />
      <rect x="120" y="100" width="30" height="20" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" rx="2" />
      <rect x="120" y="130" width="30" height="20" fill="#bae6fd" stroke="#0ea5e9" strokeWidth="1" rx="2" />
    </svg>
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

                {/* SVG Floor Plan */}
                <div className="p-4 bg-slate-50">
                  <FloorPlanSVG />
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
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </button>
                  );
                })}
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