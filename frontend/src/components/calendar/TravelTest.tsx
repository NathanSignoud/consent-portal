import React from 'react';
import { Route, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TravelResult } from '../../types';

interface TravelTestProps {
  isTravelLoading: boolean;
  travelError: string | null;
  travelResult: TravelResult | null;
  onTestTravel: () => void;
}

const TravelTest: React.FC<TravelTestProps> = ({ 
  isTravelLoading, 
  travelError, 
  travelResult, 
  onTestTravel 
}) => (
  <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
    <CardContent className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Test temps de trajet</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Test entre Paris centre → Arc de Triomphe (OpenRouteService).
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
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {travelError}
        </div>
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

export default TravelTest;