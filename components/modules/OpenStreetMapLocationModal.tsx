import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import LocationMapPicker, {
  LocationMapPickerHandle,
  Region,
} from '@/components/modules/LocationMapPicker';

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface SelectedLocationData {
  latitude: number;
  longitude: number;
  city: string;
  formattedAddress: string;
  radius: number;
}

interface OpenStreetMapLocationModalProps {
  visible: boolean;
  initialCoords: { latitude: number; longitude: number };
  initialCity?: string;
  initialRadius?: number;
  onClose: () => void;
  onConfirm: (data: SelectedLocationData) => void;
}

export default function OpenStreetMapLocationModal({
  visible,
  initialCoords,
  initialCity = '',
  initialRadius = 10,
  onClose,
  onConfirm,
}: OpenStreetMapLocationModalProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<LocationMapPickerHandle>(null);
  const reverseGeocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(
    initialRadius && initialRadius >= 10 ? initialRadius : 10
  );
  const [bottomSheetHeight, setBottomSheetHeight] = useState<number>(Platform.OS === 'ios' ? 360 : 330);

  // Safe area insets: modern iOS devices (Dynamic Island / notch) require >= 52pt
  const topInset = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 16);
  // Modern iOS devices (Home Indicator) require >= 34pt + comfortable button spacing
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 16) + (Platform.OS === 'ios' ? 14 : 16);

  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: initialCoords?.latitude || 30.8321,
    longitude: initialCoords?.longitude || 76.6873,
    latitudeDelta: 0.008,
    longitudeDelta: 0.008,
  });

  const [cityTitle, setCityTitle] = useState<string>(initialCity || 'Current Location');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isAddressLoading, setIsAddressLoading] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);

  // Sync region when modal opens
  useEffect(() => {
    if (visible && initialCoords?.latitude && initialCoords?.longitude) {
      const newRegion: Region = {
        latitude: initialCoords.latitude,
        longitude: initialCoords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };
      setCurrentRegion(newRegion);
      if (initialCity) {
        setCityTitle(initialCity);
      }
      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 600);
        mapRef.current?.setRadiusCircle?.(selectedRadius, {
          latitude: newRegion.latitude,
          longitude: newRegion.longitude,
        });
        reverseGeocode(newRegion.latitude, newRegion.longitude);
      }, 350);
    }
  }, [visible, initialCoords?.latitude, initialCoords?.longitude, initialCity, selectedRadius]);

  const handleSelectRadius = (r: number) => {
    setSelectedRadius(r);
    mapRef.current?.setRadiusCircle?.(r, {
      latitude: currentRegion.latitude,
      longitude: currentRegion.longitude,
    });
  };

  // Reverse Geocoding with OpenStreetMap Nominatim and Expo fallback
  const reverseGeocode = async (latitude: number, longitude: number) => {
    setIsAddressLoading(true);
    try {
      // 1. Nominatim OpenStreetMap reverse geocode
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FitFobApp/1.0 (contact@fitfob.com)',
            'Accept-Language': 'en',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.address) {
          const addr = data.address;
          const detectedCity =
            addr.city ||
            addr.town ||
            addr.suburb ||
            addr.village ||
            addr.neighbourhood ||
            addr.county ||
            addr.state_district ||
            addr.state ||
            'Custom Location';

          setCityTitle(detectedCity);
          setFullAddress(data.display_name || `${detectedCity}, India`);
          setIsAddressLoading(false);
          return;
        }
      }
    } catch (e) {
      console.log('OSM reverse geocoding failed, trying native:', e);
    }

    // 2. Native Expo reverseGeocode fallback
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const detectedCity =
          addr.city || addr.subregion || addr.district || addr.region || 'Custom Location';
        const parts = [
          addr.name,
          addr.street,
          addr.subregion || addr.district,
          addr.city,
          addr.region,
        ].filter(Boolean);

        setCityTitle(detectedCity);
        setFullAddress(parts.join(', '));
      }
    } catch (fallbackError) {
      console.log('Native reverse geocode error:', fallbackError);
    } finally {
      setIsAddressLoading(false);
    }
  };

  const debouncedReverseGeocode = useCallback((latitude: number, longitude: number) => {
    if (reverseGeocodeTimerRef.current) {
      clearTimeout(reverseGeocodeTimerRef.current);
    }
    reverseGeocodeTimerRef.current = setTimeout(() => {
      reverseGeocode(latitude, longitude);
    }, 450);
  }, []);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setCurrentRegion(newRegion);
    debouncedReverseGeocode(newRegion.latitude, newRegion.longitude);
  };

  // Search Address using Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    setSuggestions([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery.trim()
        )}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FitFobApp/1.0 (contact@fitfob.com)',
            'Accept-Language': 'en',
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        if (data.length === 1) {
          const item = data[0];
          handleSelectSuggestion(item);
        } else {
          setSuggestions(data);
        }
      }
    } catch (err) {
      console.log('Nominatim search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (item: Suggestion) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const newCoords: Region = {
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    };
    setCurrentRegion(newCoords);
    mapRef.current?.animateToRegion(newCoords, 700);

    const parts = item.display_name.split(',');
    setCityTitle(parts[0]?.trim() || 'Selected Location');
    setFullAddress(item.display_name);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  // Device GPS Auto-Detect
  const handleGetGpsLocation = async () => {
    try {
      setIsGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      if (loc?.coords) {
        const newRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };
        setCurrentRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 700);
        mapRef.current?.setRadiusCircle?.(selectedRadius, {
          latitude: newRegion.latitude,
          longitude: newRegion.longitude,
        });
        reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      }
    } catch (err) {
      console.log('GPS detection error:', err);
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (loc?.coords) {
          const newRegion: Region = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          };
          setCurrentRegion(newRegion);
          mapRef.current?.animateToRegion(newRegion, 700);
          mapRef.current?.setRadiusCircle?.(selectedRadius, {
            latitude: newRegion.latitude,
            longitude: newRegion.longitude,
          });
          reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        }
      } catch (innerErr) {
        console.log('Fallback GPS error:', innerErr);
      }
    } finally {
      setIsGpsLoading(false);
    }
  };

  const handleConfirm = () => {
    const selectedData: SelectedLocationData = {
      latitude: currentRegion.latitude,
      longitude: currentRegion.longitude,
      city: cityTitle,
      formattedAddress: fullAddress || cityTitle,
      radius: selectedRadius,
    };
    onConfirm(selectedData);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <View style={styles.container}>
        {/* Fullscreen OpenStreetMap via LocationMapPicker */}
        <View style={StyleSheet.absoluteFill}>
          <LocationMapPicker
            ref={mapRef}
            initialRegion={currentRegion}
            onRegionChangeComplete={handleRegionChangeComplete}
            onRequestLocation={handleGetGpsLocation}
            controlsPosition="middle-right"
            style={StyleSheet.absoluteFill}
          />

          {/* Central Fixed Pin with Drop Shadow */}
          <View pointerEvents="none" style={styles.centerMarkerWrapper}>
            <View style={styles.pinContainer}>
              <View style={styles.pinBubble}>
                <Text style={styles.pinBubbleText} numberOfLines={1}>
                  {cityTitle}
                </Text>
              </View>
              <Ionicons name="location" size={44} color="#E23744" />
              <View style={styles.pinShadow} />
            </View>
          </View>
        </View>

        {/* Top Header & Search Bar Overlay */}
        <View style={[styles.topOverlay, { paddingTop: topInset + 6 }]}>
          <StatusBar style="dark" />
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#0F172A" />
            </TouchableOpacity>

            {/* Search Input */}
            <View style={styles.searchBar}>
              {isSearching ? (
                <ActivityIndicator size="small" color="#E23744" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
              )}
              <TextInput
                placeholder="Search area, landmark or city..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (!text.trim()) setSuggestions([]);
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled style={{ maxHeight: 220 }}>
                {suggestions.map((item) => (
                  <TouchableOpacity
                    key={String(item.place_id)}
                    onPress={() => handleSelectSuggestion(item)}
                    style={styles.suggestionItem}
                    activeOpacity={0.7}>
                    <Ionicons name="location-outline" size={18} color="#E23744" style={{ marginRight: 10 }} />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Floating Current Location Pill Button */}
        <TouchableOpacity
          onPress={handleGetGpsLocation}
          style={[styles.currentLocationFab, { bottom: bottomSheetHeight + 14 }]}
          activeOpacity={0.85}
          disabled={isGpsLoading}>
          {isGpsLoading ? (
            <ActivityIndicator size="small" color="#E23744" style={{ marginRight: 6 }} />
          ) : (
            <Ionicons name="locate" size={17} color="#E23744" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.currentLocationFabText}>
            {isGpsLoading ? 'Locating...' : 'Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Bottom Address Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}>
          <View
            style={[styles.bottomSheet, { paddingBottom: bottomInset }]}
            onLayout={(e) => {
              const { height } = e.nativeEvent.layout;
              if (height > 0) setBottomSheetHeight(height);
            }}>
            {/* Sheet Handle */}
            <View style={styles.handleBar} />

            {/* Address Details */}
            <View style={styles.addressRow}>
              <View style={styles.addressIconWrap}>
                <Ionicons name="navigate" size={20} color="#E23744" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <Text style={styles.cityText} numberOfLines={1}>
                      {cityTitle}
                    </Text>
                    {isAddressLoading && (
                      <ActivityIndicator size="small" color="#E23744" style={{ marginLeft: 8 }} />
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={handleGetGpsLocation}
                    disabled={isGpsLoading}
                    style={styles.currentLocationInlineBtn}
                    activeOpacity={0.75}>
                    <Ionicons name="locate" size={13} color="#E23744" style={{ marginRight: 4 }} />
                    <Text style={styles.currentLocationInlineText}>GPS</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.fullAddressText} numberOfLines={2}>
                  {fullAddress || 'Drag map to choose location'}
                </Text>
              </View>
            </View>

            {/* Range / Radius Filter (Up to 30km) */}
            <View style={styles.rangeSection}>
              <View style={styles.rangeHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="radio-outline" size={16} color="#E23744" style={{ marginRight: 6 }} />
                  <Text style={styles.rangeTitle}>Search Range / Radius</Text>
                </View>
                <View style={styles.rangeBadge}>
                  <Text style={styles.rangeBadgeText}>{selectedRadius} km</Text>
                </View>
              </View>

              <Text style={styles.rangeSubText}>
                Showing gyms and fitness clubs within {selectedRadius} km radius
              </Text>

              {/* Range Chips: 10, 15, 20, 25, 30 km */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rangeChipsContainer}>
                {[10, 15, 20, 25, 30].map((r) => {
                  const isSelected = selectedRadius === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => handleSelectRadius(r)}
                      activeOpacity={0.75}
                      style={[
                        styles.rangeChip,
                        isSelected && styles.rangeChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.rangeChipText,
                          isSelected && styles.rangeChipTextActive,
                        ]}>
                        {r} km
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Confirm Location Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.confirmButton}
              activeOpacity={0.88}>
              <Text style={styles.confirmButtonText}>Confirm Location ({selectedRadius} km)</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerMarkerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -22 }],
  },
  pinBubble: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 2,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinBubbleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  pinShadow: {
    width: 10,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginTop: -3,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  searchBar: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    padding: 0,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
  },
  currentLocationFab: {
    position: 'absolute',
    right: 16,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentLocationFabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentLocationInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD0DC',
  },
  currentLocationInlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E23744',
  },
  bottomSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEAEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  fullAddressText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  confirmButton: {
    backgroundColor: '#E23744',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rangeSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rangeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  rangeBadge: {
    backgroundColor: '#FFEAEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD0DC',
  },
  rangeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E23744',
  },
  rangeSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 10,
  },
  rangeChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 3,
    paddingRight: 16,
  },
  rangeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeChipActive: {
    backgroundColor: '#E23744',
    borderColor: '#E23744',
    shadowColor: '#E23744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  rangeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  rangeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
