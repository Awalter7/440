import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

// MapTiler Component
export default function MapTilerMap({
  apiKey = 'ICCj0cy75a8tjtZN3pKM',
  mapStyle = 'streets-v2',
  longitude = -81.9748,
  latitude = 33.4735,
  zoom = 12,
  pitch = 0,
  bearing = 0,
  minZoom = 0,
  maxZoom = 22,
  width = '100%',
  height = '400px',
  showControls = true,
  showScale = false,
  interactive = true,
  markers = [],
  className = '',
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/${mapStyle}/style.json?key=${apiKey}`,
      center: [longitude, latitude],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      minZoom: minZoom,
      maxZoom: maxZoom,
      interactive: interactive,
    });

    // Add navigation controls
    if (showControls) {
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    }

    // Add scale control
    if (showScale) {
      map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left');
    }

    // Cleanup
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey, mapStyle]);

  // Update map view when props change
  useEffect(() => {
    if (!map.current) return;

    map.current.flyTo({
      center: [longitude, latitude],
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      essential: true,
    });
  }, [longitude, latitude, zoom, pitch, bearing]);

  // Update markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = markerData.color || '#3b82f6';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([markerData.longitude, markerData.latitude])
        .addTo(map.current);

      if (markerData.popup) {
        marker.setPopup(
          new maplibregl.Popup({ offset: 25 }).setText(markerData.popup)
        );
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  // Update interaction
  useEffect(() => {
    if (!map.current) return;

    if (interactive) {
      map.current.scrollZoom.enable();
      map.current.boxZoom.enable();
      map.current.dragRotate.enable();
      map.current.dragPan.enable();
      map.current.keyboard.enable();
      map.current.doubleClickZoom.enable();
      map.current.touchZoomRotate.enable();
    } else {
      map.current.scrollZoom.disable();
      map.current.boxZoom.disable();
      map.current.dragRotate.disable();
      map.current.dragPan.disable();
      map.current.keyboard.disable();
      map.current.doubleClickZoom.disable();
      map.current.touchZoomRotate.disable();
    }
  }, [interactive]);

  return (
    <div className={className} style={{ width, height, position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <style>{`
        @import url('https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css');
      `}</style>
    </div>
  );
}