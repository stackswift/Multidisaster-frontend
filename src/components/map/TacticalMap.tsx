'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTelemetryStore } from '@/store/useTelemetryStore';

mapboxgl.accessToken = 'pk.eyJ1Ijoic29oYWlsLWt1c3RhZ2kiLCJhIjoiY21qMTRlMzllMDh0OTNmcXlvdWt0aGs4cSJ9.8ga8dlVsW5byh_fN7asuzg';

export const TacticalMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-122.4194, 37.7749],
      zoom: 16,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(
        (l) => l.type === 'symbol' && l.layout?.['text-field']
      )?.id;

      // 3D Building Layer
      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#0f172a',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.85,
          },
        },
        labelLayerId
      );

      // Geospatial RAG Volumetric Risk Layers
      map.addSource('rag-risk-polygons', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: { height: 80, base: 0, risk: 'HIGH' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-122.4200, 37.7750],
                  [-122.4190, 37.7750],
                  [-122.4190, 37.7742],
                  [-122.4200, 37.7742],
                  [-122.4200, 37.7750],
                ]],
              },
            },
            {
              type: 'Feature',
              properties: { height: 40, base: 0, risk: 'SAFE' },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-122.4215, 37.7748],
                  [-122.4205, 37.7748],
                  [-122.4205, 37.7740],
                  [-122.4215, 37.7740],
                  [-122.4215, 37.7748],
                ]],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: 'volumetric-rag-layer',
        type: 'fill-extrusion',
        source: 'rag-risk-polygons',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['==', ['get', 'risk'], 'HIGH'],
            '#ff5500',
            '#10b981',
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-opacity': 0.5,
        },
      });

      // Drone Telemetry Source
      map.addSource('drone-telemetry', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'drone-pins',
        type: 'circle',
        source: 'drone-telemetry',
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'case',
            ['get', 'anomaly'],
            '#ff5500',
            '#00f0ff',
          ],
          'circle-blur': 0.4,
          'circle-opacity': 0.9,
        },
      });
    });

    return () => map.remove();
  }, []);

  // Efficient Map Updating
  useEffect(() => {
    let hasCentered = false;
    const unsub = useTelemetryStore.subscribe((state) => {
      if (!mapRef.current) return;
      const features = Object.values(state.geoJsonFeatures);
      const src = mapRef.current.getSource('drone-telemetry') as mapboxgl.GeoJSONSource;
      if (src) {
        src.setData({
          type: 'FeatureCollection',
          features: features,
        });
      }
      
      // Auto-center on the first drone location
      if (!hasCentered && features.length > 0) {
        const coords = features[0].geometry.coordinates;
        if (coords[0] !== 0 && coords[1] !== 0) {
          mapRef.current.flyTo({ center: [coords[0], coords[1]], zoom: 16 });
          hasCentered = true;
        }
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden glass-panel border border-teal-500/20">
      <div ref={mapContainerRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        <button className="px-3 py-1 bg-slate-900/80 border border-teal-500/40 rounded text-[10px] font-mono text-teal-300">
          OSM 3D Buildings
        </button>
        <button className="px-3 py-1 bg-slate-900/80 border border-orange-500/40 rounded text-[10px] font-mono text-orange-400">
          Volumetric RAG
        </button>
      </div>
    </div>
  );
};
