import { create } from "zustand";

export interface BuildingRAGData {
  id: string;
  name: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  populationDensity: number;
  structureType: string;
  coordinates: [number, number];
}

interface MapStore {
  activeLayers: {
    osmBuildings: boolean;
    censusDensity: boolean;
    heatmaps: boolean;
  };
  highlightedBuildingId: string | null;
  buildingRAGData: BuildingRAGData[];
  toggleLayer: (layer: "osmBuildings" | "censusDensity" | "heatmaps") => void;
  setHighlightedBuilding: (id: string | null) => void;
  setBuildingRAGData: (data: BuildingRAGData[]) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  activeLayers: {
    osmBuildings: true,
    censusDensity: true,
    heatmaps: false,
  },
  highlightedBuildingId: null,
  buildingRAGData: [
    {
      id: "bldg-101",
      name: "Residential Complex A",
      riskLevel: "critical",
      populationDensity: 420,
      structureType: "Masonry/Concrete",
      coordinates: [-122.4194, 37.7749],
    },
    {
      id: "bldg-102",
      name: "Community Center",
      riskLevel: "high",
      populationDensity: 180,
      structureType: "Steel Frame",
      coordinates: [-122.418, 37.7755],
    },
  ],
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: {
        ...state.activeLayers,
        [layer]: !state.activeLayers[layer],
      },
    })),
  setHighlightedBuilding: (id) => set({ highlightedBuildingId: id }),
  setBuildingRAGData: (data) => set({ buildingRAGData: data }),
}));
