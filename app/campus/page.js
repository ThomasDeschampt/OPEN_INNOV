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
  const [selectedFloor, setSelectedFloor] = useState(0);
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

  const floors = [
    { id: 0, label: 'RDC', name: 'Rez-de-chaussée' },
    { id: 1, label: '1er', name: '1er étage' },
    { id: 2, label: '2ème', name: '2ème étage' },
  ];

  const locationTypes = {
    classroom: { icon: Building, color: 'bg-blue-500', label: 'Salle de cours' },
    office: { icon: Users, color: 'bg-purple-500', label: 'Bureau' },
    cafeteria: { icon: Coffee, color: 'bg-orange-500', label: 'Cafétéria' },
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

  const filteredLocations = locations.filter(loc => loc.floor === selectedFloor);

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
                {/* Floor Selector */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-700">Étage</span>
                  </div>
                  <div className="flex gap-2">
                    {floors.map(floor => (
                      <button
                        key={floor.id}
                        onClick={() => setSelectedFloor(floor.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                          selectedFloor === floor.id
                            ? 'bg-epsi-blue text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {floor.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Map */}
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 p-8">
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Building Outline */}
                  <div className="absolute inset-8 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center">
                    <span className="text-slate-400 text-sm">
                      {floors.find(f => f.id === selectedFloor)?.name}
                    </span>
                  </div>

                  {/* Location Points */}
                  {filteredLocations.map(location => {
                    const typeInfo = locationTypes[location.type] || locationTypes.other;
                    const Icon = typeInfo.icon;
                    
                    return (
                      <button
                        key={location.id}
                        onClick={() => setSelectedLocation(location)}
                        className={`map-point ${typeInfo.color} flex items-center justify-center text-white shadow-lg`}
                        style={{
                          left: `${location.x_position * 100}%`,
                          top: `${location.y_position * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        title={location.name}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="p-4 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-3">Légende</p>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(locationTypes).map(([key, { icon: Icon, color, label }]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-slate-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Location List */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">
                Emplacements - {floors.find(f => f.id === selectedFloor)?.name}
              </h3>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map(location => {
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
                            <p className="font-medium text-slate-900 truncate">{location.name}</p>
                            <p className="text-xs text-slate-500">{typeInfo.label}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Aucun emplacement à cet étage</p>
                  </div>
                )}
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
                    {locationTypes[selectedLocation.type]?.label} • {floors.find(f => f.id === selectedLocation.floor)?.name}
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
              <span>Cliquez sur la carte pour localiser</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}