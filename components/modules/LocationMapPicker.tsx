import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

export interface LocationMapPickerHandle {
  animateToRegion: (region: Region, duration?: number) => void;
}

interface LocationMapPickerProps {
  initialRegion: Region;
  onRegionChangeComplete: (region: Region) => void;
  onRequestLocation?: () => void;
  onMapTouchStart?: () => void;
  onMapTouchEnd?: () => void;
  controlsPosition?: 'top-right' | 'bottom-right' | 'middle-right';
  style?: any;
}

export const LocationMapPicker = forwardRef<LocationMapPickerHandle, LocationMapPickerProps>(
  ({ initialRegion, onRegionChangeComplete, onRequestLocation, onMapTouchStart, onMapTouchEnd, controlsPosition = 'top-right', style }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const mapReadyRef = useRef<boolean>(false);
    const pendingRegionRef = useRef<Region | null>(null);

    const applyRegion = (region: Region) => {
      if (webViewRef.current && region && region.latitude && region.longitude) {
        const js = `if (window.setCenter) { window.setCenter(${region.latitude}, ${region.longitude}, 17); } true;`;
        webViewRef.current.injectJavaScript(js);
      }
    };

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: Region, _duration?: number) => {
        if (!region || !region.latitude || !region.longitude) return;
        pendingRegionRef.current = region;
        if (mapReadyRef.current) {
          applyRegion(region);
        } else {
          setTimeout(() => {
            if (pendingRegionRef.current) {
              applyRegion(pendingRegionRef.current);
            }
          }, 500);
          setTimeout(() => {
            if (pendingRegionRef.current) {
              applyRegion(pendingRegionRef.current);
            }
          }, 1200);
        }
      },
    }));

    // Memoize HTML source so WebView NEVER reloads or resets zoom on state changes
    const htmlSource = useMemo(() => {
      const lat = initialRegion?.latitude || 30.7046;
      const lng = initialRegion?.longitude || 76.7179;
      let controlsPositionCss = 'top: 12px; right: 12px;';
      if (controlsPosition === 'bottom-right') {
        controlsPositionCss = 'bottom: 24px; right: 12px;';
      } else if (controlsPosition === 'middle-right') {
        controlsPositionCss = 'top: 175px; right: 12px;';
      }

      return {
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossOrigin=""></script>
            <style>
              * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
              html, body, #map {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #F8FAFC;
                -webkit-user-select: none;
                user-select: none;
              }
              .leaflet-container {
                background: #F8FAFC !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              }
              .leaflet-control-attribution {
                display: none !important;
              }
              /* Floating Zoom & Satellite Controls */
              .floating-controls {
                position: absolute;
                ${controlsPositionCss}
                z-index: 1000;
                display: flex;
                flex-direction: column;
                gap: 8px;
              }
              .btn-float {
                width: 40px;
                height: 40px;
                border-radius: 20px;
                background: #FFFFFF;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
                border: 1px solid #E2E8F0;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                user-select: none;
                font-size: 18px;
                font-weight: 800;
                color: #0F172A;
              }
              .btn-float:active {
                background: #F1F5F9;
                transform: scale(0.94);
              }
            </style>
          </head>
          <body>
            <div id="map"></div>

            <div class="floating-controls">
              <div class="btn-float" id="satBtn" onclick="toggleSatellite()" title="Toggle Satellite">🛰️</div>
              <div class="btn-float" onclick="map.zoomIn()" title="Zoom In">+</div>
              <div class="btn-float" onclick="map.zoomOut()" title="Zoom Out">−</div>
            </div>

            <script>
              var lat = ${lat};
              var lng = ${lng};

              var map = L.map('map', {
                zoomControl: false,
                attributionControl: false,
                fadeAnimation: false,
                zoomAnimation: true,
                markerZoomAnimation: false,
                zoomSnap: 1,
                zoomDelta: 1,
                wheelPxPerZoomLevel: 60,
                dragging: true,
                touchZoom: true,
                doubleClickZoom: true,
                scrollWheelZoom: true,
                minZoom: 4,
                maxZoom: 19
              }).setView([lat, lng], 17);

              // 1. Official OpenStreetMap Tiles (100% Free, NO API Key, NO watermark)
              var osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                maxNativeZoom: 19,
                tileSize: 256,
                attribution: ''
              });

              // 2. High-Res Satellite Imagery (Esri World Imagery - 100% Free, NO API Key, NO watermark)
              var satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                maxNativeZoom: 19,
                attribution: ''
              });

              // 3. Satellite Place & Road Labels (Overlaid over satellite photos)
              var satLabelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19,
                maxNativeZoom: 19,
                attribution: ''
              });

              // Default to Clean OpenStreetMap layer
              osmLayer.addTo(map);

              var currentMode = 'roadmap';

              function toggleSatellite() {
                var satBtn = document.getElementById('satBtn');
                if (currentMode === 'roadmap') {
                  map.removeLayer(osmLayer);
                  satLayer.addTo(map);
                  satLabelsLayer.addTo(map);
                  currentMode = 'satellite';
                  if (satBtn) satBtn.innerHTML = '🗺️';
                } else {
                  map.removeLayer(satLayer);
                  map.removeLayer(satLabelsLayer);
                  osmLayer.addTo(map);
                  currentMode = 'roadmap';
                  if (satBtn) satBtn.innerHTML = '🛰️';
                }
              }

              // Post touch events to React Native to disallow outer ScrollView scrolling
              document.addEventListener('touchstart', function(e) {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'touchStart' }));
                }
              }, { passive: true });

              document.addEventListener('touchend', function(e) {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'touchEnd' }));
                }
              }, { passive: true });

              // Send region change when user drags or zooms
              var isProgrammaticMove = false;
              map.on('moveend', function() {
                if (isProgrammaticMove) {
                  isProgrammaticMove = false;
                  return;
                }
                var center = map.getCenter();
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'regionChange',
                    latitude: center.lat,
                    longitude: center.lng,
                    zoom: map.getZoom(),
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005
                  }));
                }
              });

              window.setCenter = function(newLat, newLng, newZoom) {
                if (typeof newLat === 'number' && typeof newLng === 'number') {
                  isProgrammaticMove = true;
                  var z = (typeof newZoom === 'number') ? newZoom : map.getZoom();
                  map.setView([newLat, newLng], z, { animate: true, duration: 0.5 });
                }
              };

              setTimeout(function() {
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
                }
              }, 100);
            </script>
          </body>
          </html>
        `,
        baseUrl: 'https://tile.openstreetmap.org',
      };
    }, []);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data && data.type === 'mapReady') {
          mapReadyRef.current = true;
          if (pendingRegionRef.current) {
            applyRegion(pendingRegionRef.current);
          }
        } else if (data && data.type === 'touchStart') {
          if (onMapTouchStart) onMapTouchStart();
        } else if (data && data.type === 'touchEnd') {
          if (onMapTouchEnd) onMapTouchEnd();
        } else if (data && data.type === 'regionChange') {
          if (onRegionChangeComplete) {
            onRegionChangeComplete({
              latitude: data.latitude,
              longitude: data.longitude,
              latitudeDelta: data.latitudeDelta || 0.005,
              longitudeDelta: data.longitudeDelta || 0.005,
            });
          }
        } else if (data && data.type === 'requestLocation') {
          if (onRequestLocation) {
            onRequestLocation();
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const disallowParentScroll = (e: any) => {
      if (e?.nativeEvent && typeof (e.target as any)?.requestDisallowInterceptTouchEvent === 'function') {
        (e.target as any).requestDisallowInterceptTouchEvent(true);
      }
      if (onMapTouchStart) onMapTouchStart();
    };

    return (
      <View
        style={[styles.container, style]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={disallowParentScroll}
        onResponderMove={disallowParentScroll}
        onResponderRelease={() => {
          if (onMapTouchEnd) onMapTouchEnd();
        }}
        onTouchStart={disallowParentScroll}
        onTouchMove={disallowParentScroll}
        onTouchEnd={() => {
          if (onMapTouchEnd) onMapTouchEnd();
        }}
      >
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={htmlSource}
          style={styles.map}
          onMessage={handleMessage}
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
          mixedContentMode="always"
        />
      </View>
    );
  }
);

LocationMapPicker.displayName = 'LocationMapPicker';

export default LocationMapPicker;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
  },
});