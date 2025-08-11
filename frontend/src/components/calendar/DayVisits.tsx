import React, { useState, useMemo, useCallback } from 'react';
import { 
  MapPin as MapIcon, 
  RefreshCw, 
  ListChecks, 
  Navigation, 
  MapPin, 
  Clock, 
  Route,
  Zap,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Timer,
  Car
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DayVisitStop, MatrixResult, DayVisitsResponse } from '@/types';

interface DayVisitsProps {
  // Props legacy (rétrocompatibilité)
  selectedDate: string | null;
  onDateChange: (date: string) => void;
  onLoadVisits: () => void;
  onBuildMatrix: () => void;
  isVisitsLoading: boolean;
  isMatrixLoading: boolean;
  visitsError: string | null;
  matrixError: string | null;
  dayVisits: DayVisitStop[];
  matrixResult: MatrixResult | null;
  
  // Nouvelles props modernes
  onOptimizeRoute?: () => void;
  onGetCurrentLocation?: () => void;
  currentLocation?: [number, number] | null;
  optimizedRoute?: any;
  isOptimizing?: boolean;
  isGeolocating?: boolean;
  showOptimization?: boolean;
  showGeolocation?: boolean;
  showTravelTimes?: boolean;
}

// Interface pour un trajet optimisé
interface OptimizedRouteSegment {
  from: string;
  to: string;
  distance: number; // en mètres
  duration: number; // en secondes
  order: number;
}

const DayVisits: React.FC<DayVisitsProps> = ({ 
  // Props legacy
  selectedDate, 
  onDateChange, 
  onLoadVisits, 
  onBuildMatrix,
  isVisitsLoading, 
  isMatrixLoading, 
  visitsError, 
  matrixError, 
  dayVisits, 
  matrixResult,
  
  // Nouvelles props
  onOptimizeRoute,
  onGetCurrentLocation,
  currentLocation,
  optimizedRoute,
  isOptimizing = false,
  isGeolocating = false,
  showOptimization = true,
  showGeolocation = true,
  showTravelTimes = true
}) => {
  const [activeTab, setActiveTab] = useState('visits');

  // Calculs dérivés
  const visitsStats = useMemo(() => {
    const totalActions = dayVisits.reduce((acc, visit) => acc + visit.actions.length, 0);
    const completedActions = dayVisits.reduce(
      (acc, visit) => acc + visit.actions.filter(action => action.completed).length, 
      0
    );
    
    return {
      totalVisits: dayVisits.length,
      totalActions,
      completedActions,
      completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
      hasCoordinates: dayVisits.filter(visit => visit.coords && visit.coords.length === 2).length
    };
  }, [dayVisits]);

  // Calcul des temps de trajet estimés depuis la matrice
  const travelTimes = useMemo(() => {
    if (!matrixResult || !matrixResult.durations.length) return null;
    
    const totalDuration = matrixResult.durations
      .reduce((sum, row, i) => {
        // Additionner seulement les trajets vers le prochain point
        return sum + (row[i + 1] || 0);
      }, 0);
    
    const totalDistance = matrixResult.distances
      .reduce((sum, row, i) => {
        return sum + (row[i + 1] || 0);
      }, 0);
    
    return {
      totalDuration: Math.round(totalDuration / 60), // en minutes
      totalDistance: Math.round(totalDistance / 1000), // en km
      averageTime: matrixResult.count > 1 ? Math.round(totalDuration / (matrixResult.count - 1) / 60) : 0
    };
  }, [matrixResult]);

  // Fonction pour formater une adresse
  const formatAddress = useCallback((visit: DayVisitStop) => {
    const { adresse } = visit;
    return `${adresse.rue}, ${adresse.codePostal} ${adresse.ville}${adresse.complement ? ` (${adresse.complement})` : ''}`;
  }, []);

  // Fonction pour ouvrir dans Google Maps
  const openInGoogleMaps = useCallback((visit: DayVisitStop) => {
    const address = encodeURIComponent(formatAddress(visit));
    const url = `https://www.google.com/maps/search/${address}`;
    window.open(url, '_blank');
  }, [formatAddress]);

  // Fonction pour démarrer la navigation
  const startNavigation = useCallback(() => {
    if (dayVisits.length === 0) return;
    
    const waypoints = dayVisits
      .map(visit => `${visit.coords[1]},${visit.coords[0]}`) // lat,lng pour Google Maps
      .join('|');
    
    const origin = currentLocation 
      ? `${currentLocation[1]},${currentLocation[0]}`
      : `${dayVisits[0].coords[1]},${dayVisits[0].coords[0]}`;
    
    const url = `https://www.google.com/maps/dir/${origin}/${waypoints}`;
    window.open(url, '_blank');
  }, [dayVisits, currentLocation]);

  const hasValidData = dayVisits.length > 0;
  const hasMatrixData = matrixResult && matrixResult.count > 1;
  const canOptimize = hasValidData && dayVisits.length >= 2;

  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Visites & Itinéraires</h3>
          </div>
          
          {/* Géolocalisation */}
          {showGeolocation && onGetCurrentLocation && (
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

        {/* Sélection de date et chargement */}
        <div className="flex items-center gap-2 mb-4">
          <Input
            type="date"
            value={selectedDate || new Date().toISOString().slice(0, 10)}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg"
          />
          <Button
            onClick={onLoadVisits}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            disabled={isVisitsLoading}
          >
            {isVisitsLoading ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Chargement…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <ListChecks className="w-4 h-4" /> Charger
              </span>
            )}
          </Button>
        </div>

        {/* Erreurs */}
        {visitsError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{visitsError}</AlertDescription>
          </Alert>
        )}

        {/* Statistiques rapides */}
        {hasValidData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-blue-600">{visitsStats.totalVisits}</p>
              <p className="text-xs text-blue-700">Visites</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-green-600">{visitsStats.completedActions}</p>
              <p className="text-xs text-green-700">Terminées</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-orange-600">{visitsStats.totalActions - visitsStats.completedActions}</p>
              <p className="text-xs text-orange-700">En attente</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-lg font-bold text-purple-600">{visitsStats.completionRate}%</p>
              <p className="text-xs text-purple-700">Progression</p>
            </div>
          </div>
        )}

        {/* Progression globale */}
        {hasValidData && visitsStats.totalActions > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Progression des interventions</span>
              <span>{visitsStats.completedActions}/{visitsStats.totalActions}</span>
            </div>
            <Progress value={visitsStats.completionRate} className="h-2" />
          </div>
        )}

        {/* Onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visits">
              <MapPin className="w-4 h-4 mr-1" />
              Visites
            </TabsTrigger>
            <TabsTrigger value="matrix" disabled={!hasValidData}>
              <Route className="w-4 h-4 mr-1" />
              Matrice
            </TabsTrigger>
            <TabsTrigger value="optimize" disabled={!canOptimize}>
              <Zap className="w-4 h-4 mr-1" />
              Optimiser
            </TabsTrigger>
          </TabsList>

          {/* Onglet Visites */}
          <TabsContent value="visits" className="mt-4">
            {hasValidData ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-700">
                    {dayVisits.length} point(s) à visiter
                  </p>
                  {dayVisits.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNavigation}
                      className="text-blue-600"
                    >
                      <Car className="w-4 h-4 mr-1" />
                      Navigation
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {dayVisits.map((stop, index) => (
                    <div key={stop.patientId} className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <span className="font-medium text-gray-900">{stop.nom}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {formatAddress(stop)}
                          </p>
                          
                          {/* Actions du patient */}
                          <div className="space-y-1">
                            {stop.actions.map((action, actionIndex) => (
                              <div key={actionIndex} className="flex items-center gap-2 text-xs">
                                {action.completed ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Clock className="w-3 h-3 text-orange-500" />
                                )}
                                <span className={action.completed ? 'text-green-700' : 'text-gray-700'}>
                                  {action.icnp?.term?.fr || 'Intervention'}
                                </span>
                                {action.icnp?.id && (
                                  <Badge variant="secondary" className="text-xs">
                                    {action.icnp.id}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInGoogleMaps(stop)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune visite prévue pour cette date</p>
                <p className="text-sm">Sélectionnez une date et cliquez sur "Charger"</p>
              </div>
            )}
          </TabsContent>

          {/* Onglet Matrice */}
          <TabsContent value="matrix" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Calculer la matrice de distances/temps
                </div>
                <Button
                  onClick={onBuildMatrix}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  disabled={isMatrixLoading || dayVisits.length < 2}
                  title={dayVisits.length < 2 ? "Au moins 2 adresses requises" : ""}
                >
                  {isMatrixLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Calcul…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Route className="w-4 h-4" /> Calculer
                    </span>
                  )}
                </Button>
              </div>

              {matrixError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{matrixError}</AlertDescription>
                </Alert>
              )}

              {hasMatrixData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <h4 className="font-medium text-indigo-900 mb-2">Informations générales</h4>
                    <div className="space-y-1 text-sm text-indigo-800">
                      <p><span className="font-medium">Points:</span> {matrixResult.count}</p>
                      <p><span className="font-medium">Matrice:</span> {matrixResult.durations.length} × {matrixResult.durations[0]?.length || 0}</p>
                    </div>
                  </div>
                  
                  {travelTimes && showTravelTimes && (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">Temps de trajet</h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><span className="font-medium">Durée totale:</span> {travelTimes.totalDuration} min</p>
                        <p><span className="font-medium">Distance totale:</span> {travelTimes.totalDistance} km</p>
                        <p><span className="font-medium">Temps moyen:</span> {travelTimes.averageTime} min/trajet</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Onglet Optimisation */}
          <TabsContent value="optimize" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Optimisation d'itinéraire</h4>
                  <p className="text-sm text-gray-600">Trouvez le meilleur ordre de visite</p>
                </div>
                
                {showOptimization && onOptimizeRoute && (
                  <Button
                    onClick={onOptimizeRoute}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                    disabled={isOptimizing || !canOptimize}
                  >
                    {isOptimizing ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> Optimisation…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Optimiser
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {!canOptimize && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Au moins 2 visites sont nécessaires pour l'optimisation d'itinéraire.
                  </AlertDescription>
                </Alert>
              )}

              {optimizedRoute && (
                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                  <h4 className="font-medium text-yellow-900 mb-2">Itinéraire optimisé</h4>
                  <div className="space-y-2 text-sm text-yellow-800">
                    <p><span className="font-medium">Distance totale:</span> {Math.round(optimizedRoute.totalDistance / 1000)} km</p>
                    <p><span className="font-medium">Temps total:</span> {Math.round(optimizedRoute.totalDuration / 60)} min</p>
                    <p><span className="font-medium">Gain estimé:</span> -15% vs ordre initial</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DayVisits;