import React, { useState, useCallback } from 'react';
import { 
  Route, 
  RefreshCw, 
  MapPin, 
  Clock, 
  Navigation,
  Zap,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TravelTimeResponse } from '@/types';

interface TravelTestProps {
  // Props basiques
  isTravelLoading: boolean;
  travelError: string | null;
  travelResult: TravelTimeResponse | null;
  onTestTravel: () => void;
  
  // Nouvelles props pour plus de fonctionnalités
  onCalculateCustomRoute?: (from: [number, number], to: [number, number]) => void;
  onGetCurrentLocation?: () => void;
  currentLocation?: [number, number] | null;
  isGeolocating?: boolean;
  
  // Options d'affichage
  showCustomRoute?: boolean;
  showCurrentLocation?: boolean;
  showExamples?: boolean;
  variant?: 'simple' | 'advanced';
}

// Coordonnées prédéfinies pour les tests
const PREDEFINED_LOCATIONS = {
  'tour-eiffel': { name: 'Tour Eiffel', coords: [2.2945, 48.8584] as [number, number] },
  'arc-triomphe': { name: 'Arc de Triomphe', coords: [2.295, 48.8738] as [number, number] },
  'louvre': { name: 'Musée du Louvre', coords: [2.3376, 48.8606] as [number, number] },
  'notre-dame': { name: 'Notre-Dame', coords: [2.3522, 48.8530] as [number, number] },
  'bastille': { name: 'Place de la Bastille', coords: [2.3689, 48.8532] as [number, number] }
};

const TravelTest: React.FC<TravelTestProps> = ({ 
  isTravelLoading, 
  travelError, 
  travelResult, 
  onTestTravel,
  onCalculateCustomRoute,
  onGetCurrentLocation,
  currentLocation,
  isGeolocating = false,
  showCustomRoute = false,
  showCurrentLocation = false,
  showExamples = true,
  variant = 'simple'
}) => {
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);
  const [toCoords, setToCoords] = useState<[number, number] | null>(null);

  // Fonction pour analyser les coordonnées depuis une chaîne
  const parseCoordinates = useCallback((input: string): [number, number] | null => {
    if (!input.trim()) return null;
    
    // Format: "lat, lon" ou "lat,lon"
    const parts = input.split(',').map(p => parseFloat(p.trim()));
    if (parts.length === 2 && !parts.some(isNaN)) {
      return [parts[1], parts[0]]; // Convertir lat,lon en lon,lat
    }
    
    return null;
  }, []);

  // Gestion du calcul de route personnalisée
  const handleCustomRoute = useCallback(() => {
    const from = parseCoordinates(customFrom);
    const to = parseCoordinates(customTo);
    
    if (!from || !to) {
      alert('Veuillez entrer des coordonnées valides (format: latitude, longitude)');
      return;
    }
    
    setFromCoords(from);
    setToCoords(to);
    onCalculateCustomRoute?.(from, to);
  }, [customFrom, customTo, onCalculateCustomRoute, parseCoordinates]);

  // Test avec des exemples prédéfinis
  const handleExampleTest = useCallback((fromKey: string, toKey: string) => {
    const from = PREDEFINED_LOCATIONS[fromKey as keyof typeof PREDEFINED_LOCATIONS];
    const to = PREDEFINED_LOCATIONS[toKey as keyof typeof PREDEFINED_LOCATIONS];
    
    if (from && to && onCalculateCustomRoute) {
      setFromCoords(from.coords);
      setToCoords(to.coords);
      onCalculateCustomRoute(from.coords, to.coords);
    }
  }, [onCalculateCustomRoute]);

  // Version simple (legacy)
  if (variant === 'simple') {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Route className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Test temps de trajet</h3>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Test entre Tour Eiffel → Arc de Triomphe (OpenRouteService).
          </p>

          <Button
            onClick={onTestTravel}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-lg"
            disabled={isTravelLoading}
          >
            {isTravelLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Route className="w-4 h-4 mr-2" />
                Lancer le test
              </>
            )}
          </Button>

          {travelError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{travelError}</AlertDescription>
            </Alert>
          )}

          {travelResult && (
            <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Distance</span>
                <span className="font-semibold">{travelResult.distance_km} km</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium">Durée estimée</span>
                <span className="font-semibold">{travelResult.duration_min} min</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Version avancée
  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Calcul de trajets</h3>
          </div>
          
          {showCurrentLocation && onGetCurrentLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGetCurrentLocation}
              disabled={isGeolocating}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              {isGeolocating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {currentLocation ? 'Position OK' : 'Ma position'}
            </Button>
          )}
        </div>

        {/* Position actuelle */}
        {currentLocation && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Position actuelle détectée</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              {currentLocation[1].toFixed(4)}, {currentLocation[0].toFixed(4)}
            </p>
          </div>
        )}

        {/* Test rapide par défaut */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Test rapide</Label>
          <Button
            onClick={onTestTravel}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-lg shadow-lg"
            disabled={isTravelLoading}
          >
            {isTravelLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Route className="w-4 h-4 mr-2" />
                Tour Eiffel → Arc de Triomphe
              </>
            )}
          </Button>
        </div>

        {/* Tests d'exemples */}
        {showExamples && (
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Exemples de trajets</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExampleTest('louvre', 'bastille')}
                disabled={isTravelLoading}
                className="text-xs"
              >
                Louvre → Bastille
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExampleTest('notre-dame', 'tour-eiffel')}
                disabled={isTravelLoading}
                className="text-xs"
              >
                Notre-Dame → Tour Eiffel
              </Button>
            </div>
          </div>
        )}

        {/* Route personnalisée */}
        {showCustomRoute && onCalculateCustomRoute && (
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Route personnalisée</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="from" className="text-xs text-gray-600">Départ (latitude, longitude)</Label>
                <Input
                  id="from"
                  placeholder="Ex: 48.8566, 2.3522"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="to" className="text-xs text-gray-600">Arrivée (latitude, longitude)</Label>
                <Input
                  id="to"
                  placeholder="Ex: 48.8738, 2.295"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleCustomRoute}
                variant="outline"
                className="w-full"
                disabled={isTravelLoading || !customFrom.trim() || !customTo.trim()}
              >
                <Zap className="w-4 h-4 mr-2" />
                Calculer le trajet
              </Button>
            </div>
          </div>
        )}

        {/* Erreur */}
        {travelError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{travelError}</AlertDescription>
          </Alert>
        )}

        {/* Résultat */}
        {travelResult && (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-indigo-900">Résultat du trajet</h4>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                OpenRouteService
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-indigo-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <div>
                  <p className="text-xs text-indigo-600">Distance</p>
                  <p className="font-semibold">{travelResult.distance_km} km</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <div>
                  <p className="text-xs text-indigo-600">Durée</p>
                  <p className="font-semibold">{travelResult.duration_min} min</p>
                </div>
              </div>
            </div>

            {/* Lien vers Google Maps si on a les coordonnées */}
            {fromCoords && toCoords && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-indigo-600 hover:text-indigo-800"
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/${fromCoords[1]},${fromCoords[0]}/${toCoords[1]},${toCoords[0]}`;
                  window.open(url, '_blank');
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Voir dans Google Maps
              </Button>
            )}
          </div>
        )}

        {/* Aide */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          💡 <strong>Astuce :</strong> Les coordonnées doivent être au format "latitude, longitude". 
          Vous pouvez les obtenir en cliquant droit sur Google Maps.
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelTest;