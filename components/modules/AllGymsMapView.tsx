import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapGymItem {
  id: string;
  title: string;
  rating: string;
  price: string;
  category: string;
  isOpen: boolean;
  image: string;
  coordinate: { latitude: number; longitude: number };
}

export interface AllGymsMapViewHandle {
  focusGym: (gymId: string) => void;
  fitAll: () => void;
}

export interface AllGymsMapViewProps {
  gyms: MapGymItem[];
  selectedGymId?: string;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelectGym?: (gymId: string) => void;
  onOpenGymDetail?: (gymId: string) => void;
  style?: any;
}

export const AllGymsMapView = forwardRef<AllGymsMapViewHandle, AllGymsMapViewProps>(
  ({ gyms, selectedGymId = '1', userLocation, onSelectGym, onOpenGymDetail, style }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const mapReadyRef = useRef(false);

    useImperativeHandle(ref, () => ({
      focusGym: (gymId: string) => {
        if (webViewRef.current && mapReadyRef.current) {
          webViewRef.current.injectJavaScript(`if (window.focusGym) { window.focusGym("${gymId}"); } true;`);
        }
      },
      fitAll: () => {
        if (webViewRef.current && mapReadyRef.current) {
          webViewRef.current.injectJavaScript(`if (window.fitAll) { window.fitAll(); } true;`);
        }
      },
    }));

    // Pass data serialized once
    const gymsDataJson = useMemo(() => JSON.stringify(gyms), [gyms]);
    const userLocJson = useMemo(() => JSON.stringify(userLocation || null), [userLocation]);

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
              background-color: #F8FAFC;
              -webkit-user-select: none;
              user-select: none;
              overflow: hidden;
            }
            .leaflet-container {
              background: #F8FAFC !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            .leaflet-control-attribution {
              display: none !important;
            }

            .leaflet-div-icon, .fitfob-gym-marker {
              background: transparent !important;
              border: none !important;
            }

            /* Modern Unified Gym Pin Badge */
            .gym-marker-wrap {
              width: 190px;
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
              transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
              user-select: none;
              position: relative;
              filter: drop-shadow(0 3px 8px rgba(15, 23, 42, 0.16));
            }
            .gym-badge-body {
              background: #FFFFFF;
              border: 1.5px solid #CBD5E1;
              border-radius: 10px;
              padding: 4px 10px 4px 6px;
              display: flex;
              align-items: center;
              gap: 6px;
              white-space: nowrap;
              max-width: 185px;
              transition: all 0.22s ease;
            }
            .gym-badge-icon {
              width: 22px;
              height: 22px;
              border-radius: 7px;
              background: #FFF1F2;
              color: #E23744;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              transition: all 0.22s ease;
            }
            .gym-badge-title {
              font-size: 11.5px;
              font-weight: 700;
              color: #0F172A;
              letter-spacing: -0.2px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 140px;
              transition: color 0.22s ease;
            }
            .gym-pin-notch {
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid #CBD5E1;
              margin-top: -1px;
              position: relative;
              z-index: 2;
              transition: border-top-color 0.22s ease;
            }
            .gym-pin-notch::after {
              content: '';
              position: absolute;
              top: -7px;
              left: -5px;
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 5px solid #FFFFFF;
              transition: border-top-color 0.22s ease;
            }

            /* Active / Clicked Gym Pin - Vibrant FitFob Red according to App */
            .gym-pin-badge.active {
              transform: translateY(-3px) scale(1.06);
              filter: drop-shadow(0 6px 16px rgba(226, 55, 68, 0.45));
              z-index: 1000 !important;
            }
            .gym-pin-badge.active .gym-badge-body {
              background: #E23744;
              border: 1.5px solid #FFFFFF;
              box-shadow: 0 4px 14px rgba(226, 55, 68, 0.35);
            }
            .gym-pin-badge.active .gym-badge-icon {
              background: #FFFFFF;
              color: #E23744;
            }
            .gym-pin-badge.active .gym-badge-title {
              color: #FFFFFF;
              font-weight: 800;
            }
            .gym-pin-badge.active .gym-pin-notch {
              border-top: 7px solid #FFFFFF;
            }
            .gym-pin-badge.active .gym-pin-notch::after {
              border-top: 6px solid #E23744;
              top: -8px;
            }
            .gym-pin-beacon {
              position: absolute;
              bottom: 1px;
              left: 50%;
              transform: translateX(-50%);
              width: 22px;
              height: 8px;
              border-radius: 50%;
              background: rgba(226, 55, 68, 0.55);
              display: none;
              pointer-events: none;
              animation: pinBeacon 1.5s infinite ease-out;
            }
            .gym-pin-badge.active .gym-pin-beacon {
              display: block;
            }
            @keyframes pinBeacon {
              0% { transform: translateX(-50%) scale(0.3); opacity: 0.95; }
              100% { transform: translateX(-50%) scale(2.6); opacity: 0; }
            }

            /* Floating Controls */
            .floating-controls {
              position: absolute;
              top: 14px;
              right: 14px;
              z-index: 1000;
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .btn-ctrl {
              width: 40px;
              height: 40px;
              border-radius: 20px;
              background: #FFFFFF;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
              border: 1px solid #E2E8F0;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              user-select: none;
              font-size: 17px;
              font-weight: 800;
              color: #0F172A;
            }
            .btn-ctrl:active {
              background: #F1F5F9;
              transform: scale(0.95);
            }

            /* Custom Leaflet Popup */
            .leaflet-popup-content-wrapper {
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
              padding: 6px;
              border: 1px solid #F1F5F9;
            }
            .leaflet-popup-content {
              margin: 4px;
              line-height: 1.3;
            }
            .leaflet-popup-tip {
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
            }
            .btn-action-gym {
              display: block;
              width: 100%;
              background: #E23744;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 800;
              text-align: center;
              padding: 7px 12px;
              border-radius: 10px;
              margin-top: 8px;
              cursor: pointer;
              border: none;
              text-decoration: none;
            }
            .btn-action-gym:active {
              background: #BE123C;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>

          <!-- Top-Right Floating Controls -->
          <div class="floating-controls">
            <div class="btn-ctrl" id="satBtn" onclick="toggleSatellite()" title="Satellite Toggle">🛰️</div>
            <div class="btn-ctrl" onclick="fitAll()" title="Fit All Gyms">🗺️</div>
            <div class="btn-ctrl" onclick="map.zoomIn()" title="Zoom In">+</div>
            <div class="btn-ctrl" onclick="map.zoomOut()" title="Zoom Out">−</div>
          </div>

          <script>
            var gyms = ${gymsDataJson};
            var activeId = "${selectedGymId}";
            var userLoc = ${userLocJson};
            var map = null;
            var markers = {};
            var markersGroup = null;
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

            var osmFallback = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 24,
              maxNativeZoom: 19,
              tileSize: 256,
              attribution: ''
            });

            function notifyNative(payload) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify(payload));
              }
            }

            function initMap() {
              if (typeof L === 'undefined') {
                setTimeout(initMap, 50);
                return;
              }

              try {
                // Center on Mohali
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
                }).setView([30.7046, 76.7179], 14);

                // Add Google Streets layer (fast, reliable worldwide, 0 blocks in India)
                googleStreets.addTo(map);

                markersGroup = L.featureGroup();

                gyms.forEach(function(gym) {
                  var lat = gym.coordinate ? gym.coordinate.latitude : 30.7046;
                  var lng = gym.coordinate ? gym.coordinate.longitude : 76.7179;
                  var isActive = gym.id === activeId;

                  var iconHtml = '<div class="gym-marker-wrap">' +
                    '<div class="gym-pin-badge ' + (isActive ? 'active' : '') + '" id="pill-' + gym.id + '" onclick="selectGym(\\'' + gym.id + '\\')">' +
                      '<div class="gym-badge-body">' +
                        '<div class="gym-badge-icon">' +
                          '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">' +
                            '<path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z"/>' +
                          '</svg>' +
                        '</div>' +
                        '<span class="gym-badge-title">' + gym.title + '</span>' +
                      '</div>' +
                      '<div class="gym-pin-notch"></div>' +
                      '<div class="gym-pin-beacon"></div>' +
                    '</div>' +
                  '</div>';

                  var icon = L.divIcon({
                    className: 'fitfob-gym-marker',
                    html: iconHtml,
                    iconSize: [190, 48],
                    iconAnchor: [95, 45],
                    popupAnchor: [0, -42]
                  });

                  var marker = L.marker([lat, lng], { icon: icon }).addTo(map);
                  marker.on('click', function() {
                    selectGym(gym.id);
                  });
                  markers[gym.id] = marker;
                  markersGroup.addLayer(marker);

                  var popupHtml = '<div style="text-align: center; min-width: 170px; max-width: 220px; padding: 2px;">' +
                    (gym.image ? '<img src="' + gym.image + '" style="width: 100%; height: 95px; border-radius: 10px; object-fit: cover; margin-bottom: 6px;" />' : '') +
                    '<div style="font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.2;">' + gym.title + '</div>' +
                    '<div style="font-size: 11px; font-weight: 700; color: #E23744; margin-top: 3px;">' + (gym.price || '') + ' • ' + (gym.category || 'Gym') + '</div>' +
                    '<button class="btn-action-gym" onclick="openGymDetail(\\'' + gym.id + '\\')">View Details & Book &rarr;</button>' +
                  '</div>';

                  marker.bindPopup(popupHtml, { closeButton: false, autoClose: true });
                });

                // User location
                if (userLoc && userLoc.latitude && userLoc.longitude) {
                  var userIcon = L.divIcon({
                    html: '<div style="width: 20px; height: 20px; border-radius: 50%; background: #2563EB; border: 3px solid #FFFFFF; box-shadow: 0 0 10px #2563EB;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  });
                  L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon }).addTo(map);
                }

                // Initial framing: auto-frame all gyms
                setTimeout(function() {
                  map.invalidateSize();
                  if (markersGroup.getLayers().length > 0) {
                    map.fitBounds(markersGroup.getBounds(), { padding: [50, 50], maxZoom: 15 });
                  }
                }, 200);

                setTimeout(function() {
                  map.invalidateSize();
                }, 600);

                // Notify Native
                notifyNative({ type: 'mapReady' });
              } catch(e) {
                notifyNative({ type: 'jsError', error: e.message });
              }
            }

            window.selectGym = function(gymId) {
              window.focusGym(gymId);
              notifyNative({ type: 'selectGym', gymId: gymId });
            };

            window.openGymDetail = function(gymId) {
              notifyNative({ type: 'openGymDetail', gymId: gymId });
            };

            window.focusGym = function(gymId) {
              activeId = gymId;
              gyms.forEach(function(g) {
                var el = document.getElementById('pill-' + g.id);
                if (el) {
                  if (g.id === gymId) {
                    el.classList.add('active');
                  } else {
                    el.classList.remove('active');
                  }
                }
              });

              // Bring selected marker visually on top of all other markers
              Object.keys(markers).forEach(function(id) {
                if (markers[id]) {
                  markers[id].setZIndexOffset(id === gymId ? 1000 : 0);
                }
              });

              var m = markers[gymId];
              if (m && map) {
                map.setView(m.getLatLng(), Math.max(map.getZoom(), 16), { animate: true, duration: 0.5 });
                setTimeout(function() {
                  m.openPopup();
                }, 250);
              }
            };

            window.fitAll = function() {
              if (markersGroup && markersGroup.getLayers().length > 0) {
                map.fitBounds(markersGroup.getBounds(), { padding: [45, 45], maxZoom: 15 });
              }
            };

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
    }, [gymsDataJson, userLocJson]);

    const handleMessage = (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data?.type === 'mapReady') {
          mapReadyRef.current = true;
        } else if (data?.type === 'selectGym') {
          onSelectGym?.(data.gymId);
        } else if (data?.type === 'openGymDetail') {
          onOpenGymDetail?.(data.gymId);
        }
      } catch {}
    };

    return (
      <View style={[styles.container, style]}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://tile.openstreetmap.org' }}
          style={styles.webView}
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

AllGymsMapView.displayName = 'AllGymsMapView';

export default AllGymsMapView;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  webView: {
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
