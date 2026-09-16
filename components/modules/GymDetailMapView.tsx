import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export interface GymDetailMapViewProps {
  title: string;
  address: string;
  coordinate: { latitude: number; longitude: number };
  userLocation?: { latitude: number; longitude: number } | null;
  onGetDirections?: () => void;
  onOpenAllGymsMap?: () => void;
  height?: number;
  style?: any;
}

export const GymDetailMapView: React.FC<GymDetailMapViewProps> = ({
  title,
  address,
  coordinate,
  userLocation,
  onGetDirections,
  onOpenAllGymsMap,
  height = 260,
  style,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const safeLat = coordinate?.latitude || 30.7046;
  const safeLng = coordinate?.longitude || 76.7179;

  // Non-blocking loading fallback
  useEffect(() => {
    const timer = setTimeout(() => setIsMapLoaded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const gymDataJson = useMemo(() => {
    return JSON.stringify({
      title: title || 'Gym Location',
      address: address || 'Mohali, Punjab',
      lat: safeLat,
      lng: safeLng,
      userLoc: userLocation || null,
    });
  }, [title, address, safeLat, safeLng, userLocation]);

  const htmlContent = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
        <script>
          if (typeof L === 'undefined') {
            document.write('<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.min.js"><\\/script>');
          }
        </script>
        <script>
          if (typeof L === 'undefined') {
            document.write('<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\\/script>');
          }
        </script>
        <style>
          * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #FAF7F8;
            -webkit-user-select: none;
            user-select: none;
            overflow: hidden;
          }
          .leaflet-container {
            background: #FAF7F8 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .leaflet-control-attribution {
            display: none !important;
          }

          .leaflet-div-icon, .fitfob-single-marker {
            background: transparent !important;
            border: none !important;
          }

          /* Floating Modern Gym Pin Badge */
          .gym-marker-wrap {
            width: 200px;
            height: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end;
            cursor: pointer;
            position: relative;
          }
          .gym-pin-badge {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            user-select: none;
            position: relative;
            transform: translateY(-2px) scale(1.05);
            filter: drop-shadow(0 6px 16px rgba(226, 55, 68, 0.45));
          }
          .gym-badge-body {
            background: #E23744;
            border: 1.5px solid #FFFFFF;
            box-shadow: 0 4px 14px rgba(226, 55, 68, 0.35);
            border-radius: 10px;
            padding: 4px 10px 4px 6px;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            max-width: 195px;
          }
          .gym-badge-icon {
            width: 22px;
            height: 22px;
            border-radius: 7px;
            background: #FFFFFF;
            color: #E23744;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .gym-badge-title {
            font-size: 12px;
            font-weight: 800;
            color: #FFFFFF;
            letter-spacing: -0.2px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 150px;
          }
          .gym-pin-notch {
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 7px solid #FFFFFF;
            margin-top: -1px;
            position: relative;
            z-index: 2;
          }
          .gym-pin-notch::after {
            content: '';
            position: absolute;
            top: -8px;
            left: -6px;
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid #E23744;
          }
          .gym-pin-beacon {
            position: absolute;
            bottom: 1px;
            left: 50%;
            transform: translateX(-50%);
            width: 24px;
            height: 9px;
            border-radius: 50%;
            background: rgba(226, 55, 68, 0.6);
            pointer-events: none;
            animation: pinBeacon 1.5s infinite ease-out;
          }
          @keyframes pinBeacon {
            0% { transform: translateX(-50%) scale(0.3); opacity: 0.95; }
            100% { transform: translateX(-50%) scale(2.6); opacity: 0; }
          }

          /* Floating Controls inside map */
          .floating-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .btn-ctrl {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            font-size: 15px;
            font-weight: 800;
            color: #E23744;
          }
          .btn-ctrl:active {
            background: #FFEAEF;
            transform: scale(0.92);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>

        <!-- Floating Controls -->
        <div class="floating-controls">
          <div class="btn-ctrl" id="satBtn" onclick="toggleSatellite()" title="Satellite Toggle">🛰️</div>
          <div class="btn-ctrl" onclick="recenterGym()" title="Recenter Gym">🎯</div>
          <div class="btn-ctrl" onclick="map.zoomIn()" title="Zoom In">+</div>
          <div class="btn-ctrl" onclick="map.zoomOut()" title="Zoom Out">−</div>
        </div>

        <script>
          var data = ${gymDataJson};
          var map = null;
          var currentMode = 'streets';

          var googleStreets = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 24,
            maxNativeZoom: 21,
            attribution: ''
          });

          var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
            maxZoom: 24,
            maxNativeZoom: 20,
            attribution: ''
          });

          window.toggleSatellite = function() {
            var satBtn = document.getElementById('satBtn');
            if (currentMode === 'streets') {
              map.removeLayer(googleStreets);
              googleSatellite.addTo(map);
              currentMode = 'satellite';
              if (satBtn) satBtn.innerHTML = '🗺️';
            } else {
              map.removeLayer(googleSatellite);
              googleStreets.addTo(map);
              currentMode = 'streets';
              if (satBtn) satBtn.innerHTML = '🛰️';
            }
          };

          window.recenterGym = function() {
            if (map) {
              map.setView([data.lat, data.lng], 16.5, { animate: true, duration: 0.6 });
            }
          };

          function initMap() {
            if (typeof L === 'undefined') {
              setTimeout(initMap, 50);
              return;
            }

            try {
              map = L.map('map', {
                zoomControl: false,
                attributionControl: false,
                fadeAnimation: false,
                zoomAnimation: true,
                markerZoomAnimation: false,
                zoomSnap: 0.5,
                zoomDelta: 1,
                wheelPxPerZoomLevel: 60,
                dragging: true,
                touchZoom: true,
                doubleClickZoom: true,
                scrollWheelZoom: true,
                minZoom: 3,
                maxZoom: 24
              }).setView([data.lat, data.lng], 16.5);

              // Add fast Google streets
              googleStreets.addTo(map);

              // Coverage Radius Circle around this Gym
              L.circle([data.lat, data.lng], {
                color: '#E23744',
                weight: 2,
                fillColor: '#E23744',
                fillOpacity: 0.12,
                radius: 160,
                dashArray: '5, 5'
              }).addTo(map);

              // Single Gym Pin Marker
              var markerHtml =
                '<div class="gym-marker-wrap">' +
                  '<div class="gym-pin-badge">' +
                    '<div class="gym-badge-body">' +
                      '<div class="gym-badge-icon">' +
                        '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">' +
                          '<path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z"/>' +
                        '</svg>' +
                      '</div>' +
                      '<span class="gym-badge-title">' + (data.title || 'Gym') + '</span>' +
                    '</div>' +
                    '<div class="gym-pin-notch"></div>' +
                    '<div class="gym-pin-beacon"></div>' +
                  '</div>' +
                '</div>';

              var icon = L.divIcon({
                className: 'fitfob-single-marker',
                html: markerHtml,
                iconSize: [200, 48],
                iconAnchor: [100, 45]
              });

              L.marker([data.lat, data.lng], { icon: icon }).addTo(map);

              // Invalidate size after layout
              setTimeout(function() {
                if (map) map.invalidateSize();
              }, 100);
              setTimeout(function() {
                if (map) map.invalidateSize();
              }, 400);
              setTimeout(function() {
                if (map) map.invalidateSize();
              }, 900);

              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
              }
            } catch (e) {
              console.error(e);
            }
          }

          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initMap();
          } else {
            window.addEventListener('DOMContentLoaded', initMap);
            window.addEventListener('load', initMap);
          }
        </script>
      </body>
      </html>
    `;
  }, [gymDataJson]);

  const handleMessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed?.type === 'mapReady') {
        setIsMapLoaded(true);
      }
    } catch {}
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'https://tile.openstreetmap.org' }}
        style={styles.webView}
        onMessage={handleMessage}
        onLoad={() => setIsMapLoaded(true)}
        onError={() => setIsMapLoaded(true)}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        nestedScrollEnabled={true}
        scalesPageToFit={false}
        bounces={false}
        overScrollMode="never"
      />

      {/* Bottom-Left: Open All Gyms Map View Button */}
      {onOpenAllGymsMap && (
        <TouchableOpacity
          onPress={onOpenAllGymsMap}
          activeOpacity={0.9}
          style={styles.fullMapButton}
        >
          <Ionicons name="map-outline" size={14} color="#1E293B" />
          <Text style={styles.fullMapText}>All Gyms Map</Text>
        </TouchableOpacity>
      )}

      {/* Bottom-Right: Get Directions Button */}
      {onGetDirections && (
        <TouchableOpacity
          onPress={onGetDirections}
          activeOpacity={0.9}
          style={styles.directionsButton}
        >
          <Ionicons name="navigate" size={14} color="#FFFFFF" />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      )}

      {/* Subtle Loading Pill until ready */}
      {!isMapLoaded && (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color="#E23744" />
            <Text style={styles.loadingText}>Loading Map...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default GymDetailMapView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FAF7F8',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 55, 68, 0.25)',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  webView: {
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: '#FAF7F8',
  },
  directionsButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1001,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E23744',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    gap: 5,
  },
  directionsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fullMapButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    zIndex: 1001,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 5,
  },
  fullMapText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    zIndex: 1002,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E23744',
    marginLeft: 6,
  },
});
