import React, { useImperativeHandle, forwardRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useClientGovId } from '@/hook/useClient';

interface GovernmentIdProps {
  govIdUri: string | null;
  setGovIdUri: (uri: string | null) => void;
}

export interface GovernmentIdRef {
  uploadId: () => Promise<void>;
  submit: () => Promise<boolean>;
}

const GovernmentId = forwardRef<GovernmentIdRef, GovernmentIdProps>(
  ({ govIdUri, setGovIdUri }, ref) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { mutateAsync, isPending } = useClientGovId();

    const disabled = isSubmitting || isPending;

    const uploadId = async () => {
      if (disabled) return;
      // Show choices: Camera or Gallery
      Alert.alert('Upload Government ID', 'Choose a source to upload your ID card:', [
        {
          text: 'Take Photo (Camera)',
          onPress: handleLaunchCamera,
        },
        {
          text: 'Choose from Gallery',
          onPress: handleLaunchLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    };

    const handleLaunchCamera = async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to snap a picture of your ID.'
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          cameraType: ImagePicker.CameraType.back,
          allowsEditing: true,
          quality: 0.9,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const manipResult = await manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 1600 } }],
            { compress: 0.8, format: SaveFormat.JPEG }
          );
          setGovIdUri(manipResult.uri);
        }
      } catch (error) {
        console.error('Error launching camera:', error);
        Alert.alert('Error', 'Unable to open the camera.');
      }
    };

    const handleLaunchLibrary = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Permission to access the photo gallery is required.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.9,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const manipResult = await manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 1600 } }],
            { compress: 0.8, format: SaveFormat.JPEG }
          );
          setGovIdUri(manipResult.uri);
        }
      } catch (error) {
        console.error('Error launching library:', error);
        Alert.alert('Error', 'Unable to open your photo gallery.');
      }
    };

    // Expose uploadId and submit functions to parent
    useImperativeHandle(ref, () => ({
      uploadId,
      submit: async () => {
        if (!govIdUri) {
          Alert.alert('Validation Error', 'Please upload a government ID.');
          return false;
        }
        setIsSubmitting(true);
        try {
          await mutateAsync(govIdUri);
          return true;
        } catch (error) {
          console.error('Error uploading government ID:', error);
          return false;
        } finally {
          setIsSubmitting(false);
        }
      },
    }));

    return (
      <View className="flex-1 items-center bg-white px-6">
        {/* Header Section */}
        <View className="mb-8 mt-6 items-center">
          <Text className="text-center font-bold text-3xl text-slate-900">Government ID</Text>
          <Text className="mt-2 text-center text-sm text-slate-400">
            Please upload a photo of your government ID.
          </Text>
        </View>

        {/* ID Rectangular Frame Section */}
        <View className="my-6 flex-1 items-center justify-center">
          <View style={styles.cardContainer}>
            {govIdUri ? (
              <View className="relative h-full w-full">
                <Image source={{ uri: govIdUri }} className="h-full w-full" resizeMode="cover" />
                {/* Floating Clear/Trash Button */}
                <TouchableOpacity
                  disabled={disabled}
                  onPress={() => setGovIdUri(null)}
                  className={`absolute bottom-3 right-3 items-center justify-center rounded-full p-3 ${
                    disabled ? 'bg-slate-400 opacity-50' : 'bg-slate-900/80'
                  }`}
                  style={{
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                  activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                disabled={disabled}
                onPress={uploadId}
                className="h-full w-full items-center justify-center bg-slate-50"
                activeOpacity={0.7}>
                <Ionicons name="card-outline" size={44} color="#94a3b8" />
                <Text className="mt-3 font-semibold text-xs text-slate-400">Tap to Upload ID</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tip / Guidelines Section */}
        <View className="mb-10 mt-6 items-center px-4">
          <Text className="text-center text-sm leading-relaxed text-slate-400">
            Tip: Make Sure all details on your ID are visible{'\n'}and clear
          </Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  cardContainer: {
    width: 320,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});

GovernmentId.displayName = 'GovernmentId';

export default GovernmentId;
