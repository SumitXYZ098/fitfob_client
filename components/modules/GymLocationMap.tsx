import React, { useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export interface GymBranchItem {
  id: string;
  name: string;
  address: string;
  coordinate: { latitude: number; longitude: number };
  isMain?: boolean;
  rating?: string;
  price?: string;
  image?: string;
}

export interface GymLocationMapProps {
  gymTitle: string;
  address: string;
  latitude: number;
  longitude: number;
  branches?: GymBranchItem[];
  userLocation?: { latitude: number; longitude: number } | null;
  onDirectionsPress?: (branch?: GymBranchItem) => void;
  onSelectBranch?: (branch: GymBranchItem) => void;
  onOpenFullMap?: () => void;
  onMapTouchStart?: () => void;
  onMapTouchEnd?: () => void;
  height?: number | string;
  style?: any;
  showBranchCountBadge?: boolean;
  showDirectionsButton?: boolean;
  showFullMapButton?: boolean;
}

export const GymLocationMap: React.FC<GymLocationMapProps> = ({
  gymTitle,
  address,
  latitude,
  longitude,
  branches,
  userLocation,
  onDirectionsPress,
  onSelectBranch,
  onOpenFullMap,
  onMapTouchStart,
  onMapTouchEnd,
  height = 260,
  style,
  showBranchCountBadge = true,
  showDirectionsButton = true,
  showFullMapButton = false,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('main');
  const interactionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guaranteed fallback: loading will NEVER get stuck or block the user!
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapLoaded(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const safeLat = latitude || 30.7046;
  const safeLng = longitude || 76.7179;

  // Build the list of branches of THIS specific gym in the area
  const branchesList: GymBranchItem[] = useMemo(() => {
    if (branches && branches.length > 0) {
      return branches;
    }

    // Default branches for this gym in Mohali/city if not explicitly provided
    return [
      {
        id: 'main',
        name: `${gymTitle} (Current Branch)`,
        address: address || 'Sector 71, Mohali',
        coordinate: { latitude: safeLat, longitude: safeLng },
        isMain: true,
      },
      {
        id: 'b2',
        name: `${gymTitle} - Phase 5 Branch`,
        address: 'SCF 32, Phase 5, Mohali',
        coordinate: { latitude: 30.7188, longitude: 76.7145 },
      },
      {
        id: 'b3',
        name: `${gymTitle} - Phase 8B Industrial Branch`,
        address: 'Plot 42, Phase 8B, Industrial Area, Mohali',
        coordinate: { latitude: 30.7090, longitude: 76.6960 },
      },
      {
        id: 'b4',
        name: `${gymTitle} - Sector 68 Branch`,
        address: 'SCO 55, Sector 68, Mohali',
        coordinate: { latitude: 30.6970, longitude: 76.7260 },
      },
      {
        id: 'b5',
        name: `${gymTitle} - Sector 82 JLPL Branch`,
        address: 'Commercial Hub, Sector 82, Mohali',
        coordinate: { latitude: 30.6720, longitude: 76.7350 },
      },
    ];
  }, [branches, gymTitle, address, safeLat, safeLng]);

  const activeBranch = useMemo(() => {
    return branchesList.find((b) => b.id === selectedBranchId) || branchesList[0];
  }, [branchesList, selectedBranchId]);

  const branchesJson = useMemo(() => JSON.stringify(branchesList), [branchesList]);
  const userLocJson = useMemo(() => JSON.stringify(userLocation || null), [userLocation]);

  const htmlSource = useMemo(() => {
    return {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
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

            /* Floating Gym Name Pill Label */
            .branch-pill-badge {
              position: absolute;
              bottom: 44px;
              left: 50%;
              transform: translateX(-50%);
              background: #FFFFFF;
              border: 1.5px solid #E23744;
              border-radius: 10px;
              padding: 4px 10px 4px 8px;
              display: flex;
              align-items: center;
              gap: 5px;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
              pointer-events: auto;
              z-index: 100;
            }
            .branch-pill-badge.active {
              background: #E23744;
              border-color: #FFFFFF;
              box-shadow: 0 4px 18px rgba(226, 55, 68, 0.55);
            }
            .branch-dot {
              width: 7px;
              height: 7px;
              border-radius: 50%;
              background: #22C55E;
              box-shadow: 0 0 5px #22C55E;
              flex-shrink: 0;
            }
            .branch-title {
              font-size: 11px;
              font-weight: 800;
              color: #0F172A;
              letter-spacing: -0.2px;
              max-width: 140px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .branch-pill-badge.active .branch-title {
              color: #FFFFFF;
            }
            .branch-rating {
              background: #FEF3C7;
              color: #D97706;
              font-size: 9.5px;
              font-weight: 800;
              padding: 1px 5px;
              border-radius: 5px;
              display: flex;
              align-items: center;
              flex-shrink: 0;
            }
            .branch-pill-badge.active .branch-rating {
              background: rgba(255, 255, 255, 0.3);
              color: #FFFFFF;
            }

            /* Main Selected Branch Pin */
            .active-branch-marker {
              position: relative;
              width: 44px;
              height: 52px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .pulse-wave {
              position: absolute;
              bottom: 4px;
              width: 32px;
              height: 16px;
              border-radius: 50%;
              background: rgba(226, 55, 68, 0.45);
              animation: pulseRing 1.8s infinite ease-out;
              pointer-events: none;
            }
            .pulse-wave-2 {
              position: absolute;
              bottom: 4px;
              width: 46px;
              height: 22px;
              border-radius: 50%;
              background: rgba(226, 55, 68, 0.22);
              animation: pulseRing 1.8s infinite 0.7s ease-out;
              pointer-events: none;
            }
            @keyframes pulseRing {
              0% { transform: scale(0.3); opacity: 0.9; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            .pin-body-active {
              position: absolute;
              top: 2px;
              width: 36px;
              height: 36px;
              background: #E23744;
              border: 2.5px solid #FFFFFF;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 14px rgba(226, 55, 68, 0.55);
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .pin-icon {
              transform: rotate(45deg);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* Other Branch Pin */
            .other-branch-marker {
              position: relative;
              width: 34px;
              height: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.2s ease;
            }
            .other-branch-marker:active {
              transform: scale(0.92);
            }
            .pin-body-branch {
              position: absolute;
              top: 2px;
              width: 28px;
              height: 28px;
              background: #F43F5E;
              border: 2px solid #FFFFFF;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 3px 10px rgba(244, 63, 94, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* User Location Marker */
            .user-marker {
              position: relative;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .user-pulse {
              position: absolute;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: rgba(14, 165, 233, 0.35);
              animation: userPulse 2s infinite ease-out;
            }
            @keyframes userPulse {
              0% { transform: scale(0.4); opacity: 0.9; }
              100% { transform: scale(2.2); opacity: 0; }
            }
            .user-dot {
              position: relative;
              width: 14px;
              height: 14px;
              background: #0284C7;
              border: 2.5px solid #FFFFFF;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(2, 132, 199, 0.5);
            }

            /* Floating Controls on Map */
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
              border-radius: 17px;
              background: #FFFFFF;
              box-shadow: 0 3px 10px rgba(0, 0, 0, 0.16);
              border: 1px solid #FEE2E2;
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

            /* Leaflet popup styling */
            .leaflet-popup-content-wrapper {
              border-radius: 16px;
              box-shadow: 0 6px 22px rgba(0, 0, 0, 0.2);
              border: 1px solid #FEE2E2;
              padding: 0;
              overflow: hidden;
            }
            .leaflet-popup-content {
              margin: 10px 12px !important;
              line-height: 1.3 !important;
            }
            .leaflet-popup-tip {
              background: #FFFFFF;
              border: 1px solid #FEE2E2;
            }
            .btn-action-branch {
              display: block;
              width: 100%;
              background: #E23744;
              color: white;
              font-size: 11px;
              font-weight: 700;
              text-align: center;
              padding: 5px 10px;
              border-radius: 8px;
              margin-top: 6px;
              cursor: pointer;
              border: none;
            }
            .btn-action-branch:active {
              background: #BE123C;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>

          <!-- Top-Right Floating Controls -->
          <div class="floating-controls">
            <div class="btn-ctrl" id="satBtn" onclick="toggleSatellite()" title="Satellite Toggle">🛰️</div>
            <div class="btn-ctrl" onclick="recenterToActiveBranch()" title="Current Branch">🏢</div>
            <div class="btn-ctrl" onclick="fitAllBranches()" title="All Branches">🗺️</div>
            <div class="btn-ctrl" id="userBtn" onclick="recenterToUser()" title="My Location" style="display:none;">📍</div>
            <div class="btn-ctrl" onclick="map.zoomIn()" title="Zoom In">+</div>
            <div class="btn-ctrl" onclick="map.zoomOut()" title="Zoom Out">−</div>
          </div>

          <script>
            window.onerror = function(msg, url, line) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'jsError', error: msg + ' (line ' + line + ')' }));
              }
            };

            function notifyMapReady() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapReady' }));
                return true;
              }
              return false;
            }

            function calculateDistance(lat1, lon1, lat2, lon2) {
              var R = 6371;
              var dLat = (lat2 - lat1) * Math.PI / 180;
              var dLon = (lon2 - lon1) * Math.PI / 180;
              var a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              var d = R * c;
              return d < 1 ? Math.round(d * 1000) + ' m' : d.toFixed(1) + ' km';
            }

            function notifyTouchStart() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'touchStart' }));
              }
            }

            function notifyTouchEnd() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'touchEnd' }));
              }
            }

            window.selectBranch = function(branchId) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectBranch', branchId: branchId }));
              }
            };

            window.openDirections = function(branchId) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'openDirections', branchId: branchId }));
              }
            };

            function initMap() {
              if (typeof L === 'undefined') {
                setTimeout(initMap, 50);
                return;
              }

              try {
                var branches = ${branchesJson};
                var activeBranchId = "${selectedBranchId}";
                var userLoc = ${userLocJson};
                var centerLat = ${safeLat};
                var centerLng = ${safeLng};

                var map = L.map('map', {
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
                }).setView([centerLat, centerLng], 14.5);

                var osmLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                  maxZoom: 24,
                  maxNativeZoom: 21,
                  attribution: ''
                });

                var satLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                  maxZoom: 24,
                  maxNativeZoom: 20,
                  attribution: ''
                });

                osmLayer.addTo(map);

                // FitFob Red Radius Circle around Active Branch
                L.circle([centerLat, centerLng], {
                  color: '#E23744',
                  weight: 2,
                  fillColor: '#E23744',
                  fillOpacity: 0.12,
                  radius: 180,
                  dashArray: '5, 5'
                }).addTo(map);

                var markersGroup = L.featureGroup();
                var activeBranchMarker = null;

                // Render all branches
                branches.forEach(function(branch) {
                  if (!branch) return;
                  var isActive = (branch.id === activeBranchId || (activeBranchId === 'main' && branch.isMain));
                  var lat = (branch.coordinate && typeof branch.coordinate.latitude === 'number')
                    ? branch.coordinate.latitude
                    : (typeof branch.latitude === 'number' ? branch.latitude : centerLat);
                  var lng = (branch.coordinate && typeof branch.coordinate.longitude === 'number')
                    ? branch.coordinate.longitude
                    : (typeof branch.longitude === 'number' ? branch.longitude : centerLng);

                  if (isNaN(lat) || isNaN(lng)) return;

                  var distText = '';
                  if (userLoc && userLoc.latitude && userLoc.longitude) {
                    distText = ' • ' + calculateDistance(userLoc.latitude, userLoc.longitude, lat, lng) + ' away';
                  }

                  var iconHtml = '';
                  if (isActive) {
                    iconHtml = '<div class="active-branch-marker" style="width: 220px; height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">' +
                      '<div class="branch-pill-badge active">' +
                        '<span class="branch-dot"></span>' +
                        '<span class="branch-title">' + (branch.name || '') + '</span>' +
                      '</div>' +
                      '<div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">' +
                        '<div class="pulse-wave-2"></div>' +
                        '<div class="pulse-wave"></div>' +
                        '<div class="pin-body-active">' +
                          '<div class="pin-icon">' +
                            '<svg width="15" height="15" viewBox="0 0 24 24" fill="white">' +
                              '<path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z"/>' +
                            '</svg>' +
                          '</div>' +
                        '</div>' +
                      '</div>' +
                    '</div>';
                  } else {
                    iconHtml = '<div class="other-branch-marker" style="width: 220px; height: 68px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">' +
                      '<div class="branch-pill-badge">' +
                        '<span class="branch-dot"></span>' +
                        '<span class="branch-title">' + (branch.name || '') + '</span>' +
                      '</div>' +
                      '<div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">' +
                        '<div class="pin-body-branch">' +
                          '<div class="pin-icon">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="white">' +
                              '<path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z"/>' +
                            '</svg>' +
                          '</div>' +
                        '</div>' +
                      '</div>' +
                    '</div>';
                  }

                  var icon = L.divIcon({
                    className: isActive ? 'fitfob-active-branch' : 'fitfob-other-branch',
                    html: iconHtml,
                    iconSize: [220, 72],
                    iconAnchor: [110, 70],
                    popupAnchor: [0, -68]
                  });

                  var marker = L.marker([lat, lng], { icon: icon }).addTo(map);
                  markersGroup.addLayer(marker);

                  var badgeBg = isActive ? '#FFEAEF' : '#F1F5F9';
                  var badgeColor = isActive ? '#E23744' : '#475569';
                  var badgeTitle = isActive ? 'Selected Gym' : 'Gym';

                  var imageHtml = branch.image ? '<img src="' + branch.image + '" style="width: 100%; height: 92px; border-radius: 10px; object-fit: cover; margin-bottom: 6px;" />' : '';
                  var priceHtml = branch.price ? '<div style="font-size: 11px; font-weight: 800; color: #E23744; margin-top: 2px;">' + branch.price + '</div>' : '';
                  var actionBtn = !isActive ? '<button class="btn-action-branch" onclick="selectBranch(\'' + branch.id + '\')">Select This Gym &rarr;</button>' : '';

                  var popupHtml = '<div style="text-align: center; min-width: 160px; max-width: 220px; padding: 4px;">' +
                    imageHtml +
                    '<div style="display: inline-block; background: ' + badgeBg + '; color: ' + badgeColor + '; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 999px; margin-bottom: 4px;">' + badgeTitle + distText + '</div>' +
                    '<div style="font-size: 13px; font-weight: 800; color: #0F172A; line-height: 1.2;">' + (branch.name || '') + '</div>' +
                    '<div style="font-size: 11px; color: #64748B; margin-top: 2px;">' + (branch.address || '') + '</div>' +
                    priceHtml +
                    actionBtn +
                    '<button class="btn-action-branch" onclick="openDirections(\'' + branch.id + '\')" style="background: #E23744; margin-top: 5px;">🧭 View Details & Navigate &rarr;</button>' +
                  '</div>';

                  marker.bindPopup(popupHtml, { closeButton: false, autoClose: !isActive });

                  if (isActive) {
                    activeBranchMarker = marker;
                    setTimeout(function() {
                      marker.openPopup();
                    }, 500);
                  }
                });

                // User Location Marker
                if (userLoc && userLoc.latitude && userLoc.longitude) {
                  var userIcon = L.divIcon({
                    className: 'fitfob-user-marker',
                    html: '<div class="user-marker"><div class="user-pulse"></div><div class="user-dot"></div></div>',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  });
                  var userMarker = L.marker([userLoc.latitude, userLoc.longitude], { icon: userIcon }).addTo(map);
                  userMarker.bindTooltip("You Are Here", { permanent: false, direction: 'top', offset: [0, -12] });
                  markersGroup.addLayer(userMarker);
                  var userBtn = document.getElementById('userBtn');
                  if (userBtn) userBtn.style.display = 'flex';
                }

                // Sizing refresh to ensure tiles immediately load inside mobile WebView
                function refreshMap() {
                  try {
                    map.invalidateSize();
                    if (branches && branches.length > 1) {
                      var bounds = markersGroup.getBounds();
                      if (bounds.isValid()) {
                        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
                      }
                    } else {
                      map.setView([centerLat, centerLng], 15);
                    }
                  } catch(e) {}
                }

                setTimeout(refreshMap, 100);
                setTimeout(refreshMap, 350);
                setTimeout(refreshMap, 800);

                var currentMode = 'roadmap';

                window.toggleSatellite = function() {
                  var satBtn = document.getElementById('satBtn');
                  if (currentMode === 'roadmap') {
                    map.removeLayer(osmLayer);
                    satLayer.addTo(map);
                    currentMode = 'satellite';
                    if (satBtn) satBtn.innerHTML = '🗺️';
                  } else {
                    map.removeLayer(satLayer);
                    osmLayer.addTo(map);
                    currentMode = 'roadmap';
                    if (satBtn) satBtn.innerHTML = '🛰️';
                  }
                };

                window.recenterToActiveBranch = function() {
                  map.setView([centerLat, centerLng], 15.5, { animate: true, duration: 0.6 });
                  if (activeBranchMarker) activeBranchMarker.openPopup();
                };

                window.recenterToUser = function() {
                  if (userLoc && userLoc.latitude && userLoc.longitude) {
                    map.setView([userLoc.latitude, userLoc.longitude], 16, { animate: true, duration: 0.6 });
                  }
                };

                window.fitAllBranches = function() {
                  if (markersGroup.getLayers().length > 0) {
                    map.fitBounds(markersGroup.getBounds(), { padding: [35, 35], maxZoom: 16 });
                  }
                };

                var mapEl = document.getElementById('map');
                if (mapEl) {
                  mapEl.addEventListener('touchstart', notifyTouchStart, { passive: true });
                  mapEl.addEventListener('touchmove', notifyTouchStart, { passive: true });
                  mapEl.addEventListener('touchend', notifyTouchEnd, { passive: true });
                }

                map.on('movestart', notifyTouchStart);
                map.on('dragstart', notifyTouchStart);
                map.on('drag', notifyTouchStart);
                map.on('dragend', notifyTouchEnd);
                map.on('moveend', notifyTouchEnd);
                map.on('zoomstart', notifyTouchStart);
                map.on('zoomend', notifyTouchEnd);

                notifyMapReady();
                var readyTimer = setInterval(function() {
                  if (notifyMapReady()) clearInterval(readyTimer);
                }, 80);
                setTimeout(function() { clearInterval(readyTimer); }, 2500);

              } catch (err) {
                console.error(err);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'jsError', error: err.message }));
                }
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
      `,
    };
  }, [branchesJson, userLocJson, selectedBranchId, safeLat, safeLng]);

  const handleStartInteraction = () => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    setIsInteracting(true);
    onMapTouchStart?.();
  };

  const handleEndInteraction = () => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    setIsInteracting(false);
    onMapTouchEnd?.();
  };

  useEffect(() => {
    return () => {
      if (interactionTimerRef.current) {
        clearTimeout(interactionTimerRef.current);
      }
    };
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'mapReady') {
        setIsMapLoaded(true);
      } else if (data?.type === 'jsError') {
        console.warn('Map WebView JS Error:', data.error);
        setIsMapLoaded(true);
      } else if (data?.type === 'touchStart') {
        handleStartInteraction();
      } else if (data?.type === 'touchEnd') {
        handleEndInteraction();
      } else if (data?.type === 'selectBranch') {
        const found = branchesList.find((b) => b.id === data.branchId);
        if (found) {
          setSelectedBranchId(found.id);
          onSelectBranch?.(found);
        }
      } else if (data?.type === 'openDirections') {
        const found = branchesList.find((b) => b.id === data.branchId);
        onDirectionsPress?.(found || activeBranch);
      }
    } catch {
      // ignore
    }
  };

  return (
    <View
      style={[
        styles.container,
        typeof height === 'number' ? { height } : { flex: 1 },
        style,
      ]}
    >
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={htmlSource}
        style={[styles.webView, { flex: 1 }]}
        onMessage={handleMessage}
        onLoadStart={() => {}}
        onLoad={() => setIsMapLoaded(true)}
        onLoadEnd={() => setIsMapLoaded(true)}
        onError={() => setIsMapLoaded(true)}
        onHttpError={() => setIsMapLoaded(true)}
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

      {/* Top-Left Badge showing branch count */}
      {showBranchCountBadge && (
        <View pointerEvents="none" style={styles.badgeContainer}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>
              {`${branchesList.length} Branches in Mohali`}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom-Left: Open All Gyms Map View Button */}
      {showFullMapButton && onOpenFullMap && (
        <TouchableOpacity
          onPress={onOpenFullMap}
          activeOpacity={0.9}
          style={styles.fullMapButton}
        >
          <Ionicons name="map-outline" size={14} color="#1E293B" />
          <Text style={styles.fullMapText}>All Gyms Map</Text>
        </TouchableOpacity>
      )}

      {/* Floating Get Directions Button */}
      {showDirectionsButton && onDirectionsPress && (
        <TouchableOpacity
          onPress={() => onDirectionsPress(activeBranch)}
          activeOpacity={0.9}
          style={styles.directionsButton}
        >
          <Ionicons name="navigate" size={14} color="#FFFFFF" />
          <Text style={styles.directionsText}>
            {activeBranch.id === 'main' ? 'Get Directions' : `Directions (${activeBranch.name.split('-')[1]?.trim() || 'Branch'})`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Subtle Non-Blocking Loading Pill until map is ready */}
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

export default GymLocationMap;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
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
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1001,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E23744',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E23744',
    letterSpacing: 0.2,
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
    borderRadius: 20,
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
