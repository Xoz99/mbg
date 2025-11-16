import { useEffect, useRef } from 'react';

interface ProvinceBoundaryOptions {
  onProvinceClick?: (provinceName: string, event: any) => void;
  onProvinceHover?: (provinceName: string, isHovering: boolean) => void;
  defaultStyle?: any;
  hoverStyle?: any;
  clickStyle?: any;
}

export const useProvinceBoundary = (
  map: any | null,
  options: ProvinceBoundaryOptions = {}
) => {
  const geoJsonLayerRef = useRef<any | null>(null);
  const lastInteractedFeatureRef = useRef<any>(null);
  const lastClickedFeatureRef = useRef<any>(null);

  const defaultStyle: any = {
    stroke: true,
    color: '#810FCB',
    weight: 2,
    opacity: 1,
    fill: true,
    fillColor: '#810FCB',
    fillOpacity: 0.08,
    ...options.defaultStyle,
  };

  const hoverStyle: any = {
    ...defaultStyle,
    weight: 3,
    fillOpacity: 0.12,
    ...options.hoverStyle,
  };

  const clickStyle: any = {
    ...defaultStyle,
    fillColor: '#810FCB',
    fillOpacity: 0.18,
    weight: 3,
    ...options.clickStyle,
  };

  useEffect(() => {
    if (!map) return;

    const loadGeoJSON = async () => {
      try {
        const L = await import('leaflet');
        const response = await fetch('/indonesia-provinces.geojson');
        const geoJsonData = await response.json();

        const geoJsonLayer = L.geoJSON(geoJsonData, {
          style: () => defaultStyle,
          onEachFeature: (feature, layer) => {
            // Handle click
            layer.on('click', (e) => {
              const provinceName = feature.properties.name;

              // Reset previous clicked feature
              if (lastClickedFeatureRef.current) {
                (lastClickedFeatureRef.current as any).setStyle(defaultStyle);
              }

              // Apply click style
              (layer as any).setStyle(clickStyle);
              lastClickedFeatureRef.current = layer;

              options.onProvinceClick?.(provinceName, e);
            });

            // Handle mouseover
            layer.on('mouseover', () => {
              const provinceName = feature.properties.name;

              // Don't change style if this is the clicked feature
              if (lastClickedFeatureRef.current !== layer) {
                (layer as any).setStyle(hoverStyle);
              }

              lastInteractedFeatureRef.current = layer;
              options.onProvinceHover?.(provinceName, true);
            });

            // Handle mouseout
            layer.on('mouseout', () => {
              const provinceName = feature.properties.name;

              // Only reset if it's not the clicked feature
              if (lastClickedFeatureRef.current !== layer) {
                (layer as any).setStyle(defaultStyle);
              }

              lastInteractedFeatureRef.current = null;
              options.onProvinceHover?.(provinceName, false);
            });
          },
        }).addTo(map);

        geoJsonLayerRef.current = geoJsonLayer;

        return () => {
          if (map && geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
          }
        };
      } catch (err) {
        console.error('Error loading province boundaries:', err);
      }
    };

    loadGeoJSON();
  }, [map]);

  const clearSelection = () => {
    if (lastClickedFeatureRef.current) {
      lastClickedFeatureRef.current.setStyle(defaultStyle);
      lastClickedFeatureRef.current = null;
    }
  };

  return {
    geoJsonLayer: geoJsonLayerRef.current,
    clearSelection,
  };
};
