import { useAuthStore } from '@/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { TextInput, TouchableOpacity, Image, Text, View, Alert } from 'react-native';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
import { useClientBasicDetails } from '@/hook/useClient';

const getMaxPhoneLength = (code: string): number => {
  const lengths: Record<string, number> = {
    IN: 10, // India
    US: 10, // USA
    CA: 10, // Canada
    GB: 10, // UK
    AU: 9, // Australia
    NZ: 9, // New Zealand
    SG: 8, // Singapore
    AE: 9, // UAE
    DE: 11, // Germany
    FR: 9, // France
    PK: 10, // Pakistan
    BD: 10, // Bangladesh
    NP: 10, // Nepal
    LK: 9, // Sri Lanka
  };
  return lengths[code] || 15; // Default E.164 max length
};

export interface BasicDetailsRef {
  submit: () => Promise<boolean>;
}

interface BasicDetailsProps {
  prefill?: any;
}

const BasicDetails = forwardRef<BasicDetailsRef, BasicDetailsProps>(({ prefill }, ref) => {
  const { user } = useAuthStore();
  const { mutateAsync } = useClientBasicDetails();

  const parsePhone = (fullPhone: string) => {
    if (!fullPhone || !fullPhone.startsWith('+')) {
      return { callingCode: '91', countryCode: 'IN' as CountryCode, number: fullPhone || '' };
    }
    const countryCallingMap: { prefix: string; cca2: CountryCode }[] = [
      { prefix: '91', cca2: 'IN' },
      { prefix: '1', cca2: 'US' },
      { prefix: '44', cca2: 'GB' },
      { prefix: '61', cca2: 'AU' },
      { prefix: '64', cca2: 'NZ' },
      { prefix: '65', cca2: 'SG' },
      { prefix: '971', cca2: 'AE' },
      { prefix: '49', cca2: 'DE' },
      { prefix: '33', cca2: 'FR' },
      { prefix: '92', cca2: 'PK' },
      { prefix: '880', cca2: 'BD' },
      { prefix: '977', cca2: 'NP' },
      { prefix: '94', cca2: 'LK' },
    ];
    const raw = fullPhone.slice(1);
    for (const item of countryCallingMap) {
      if (raw.startsWith(item.prefix)) {
        return {
          callingCode: item.prefix,
          countryCode: item.cca2,
          number: raw.slice(item.prefix.length),
        };
      }
    }
    return { callingCode: '91', countryCode: 'IN' as CountryCode, number: raw };
  };

  const initialPhone = prefill?.phoneNumber ? parsePhone(prefill.phoneNumber) : null;

  const [name, setName] = useState(prefill?.name || '');
  const [email, setEmail] = useState(prefill?.email || user?.email || '');
  const [selectedGender, setSelectedGender] = useState(prefill?.gender || 'male');
  const [countryCode, setCountryCode] = useState<CountryCode>(initialPhone?.countryCode || 'IN');
  const [callingCode, setCallingCode] = useState(initialPhone?.callingCode || '91');
  const [phoneNumber, setPhoneNumber] = useState(initialPhone?.number || '');

  useEffect(() => {
    const latestEmail = prefill?.email || user?.email;
    if (latestEmail && !email) {
      setEmail(latestEmail);
    }
  }, [prefill?.email, user?.email, email]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      if (!name.trim()) {
        Alert.alert('Validation Error', 'Please enter your name.');
        return false;
      }
      if (!phoneNumber.trim()) {
        Alert.alert('Validation Error', 'Please enter your phone number.');
        return false;
      }
      const requiredLength = getMaxPhoneLength(countryCode);
      const currentLength = phoneNumber.replace(/\D/g, '').length;
      if (requiredLength !== 15 && currentLength !== requiredLength) {
        Alert.alert(
          'Validation Error',
          `Phone number must be exactly ${requiredLength} digits for ${countryCode}.`
        );
        return false;
      }
      if (requiredLength === 15 && (currentLength < 8 || currentLength > 15)) {
        Alert.alert('Validation Error', 'Please enter a valid phone number (8-15 digits).');
        return false;
      }
      try {
        const fullPhone = `+${callingCode}${phoneNumber}`;
        await mutateAsync({
          name,
          email,
          phoneNumber: fullPhone,
          gender: selectedGender,
        });
        return true;
      } catch (error) {
        console.error('Error submitting basic details:', error);
        return false;
      }
    },
  }));

  const genders = [
    {
      id: 'male',
      label: 'Male',
      icon: 'male-outline',
      image: require('../../../assets/images/male.png'),
    },
    {
      id: 'female',
      label: 'Female',
      icon: 'female-outline',
      image: require('../../../assets/images/female.png'),
    },
    { id: 'other', label: 'Other', icon: 'male-female-outline' },
  ];

  return (
    <View className="flex-1  bg-white">
      <Text className="font-bold text-3xl leading-tight text-slate-900">What’s your name?</Text>
      <Text className="font-bold text-3xl text-slate-900">Let’s get started.</Text>

      {/* Name Input */}
      <View className="mt-4">
        <Text className="mb-1 font-medium text-slate-400">Name</Text>
        <TextInput
          placeholder="Enter Name"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
          className="h-16 rounded-2xl border border-slate-200 bg-white px-5"
        />
      </View>

      {/* Email Input (Read-only / Disabled) */}
      <View className="mt-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="font-medium text-slate-400">Email</Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="lock-closed" size={11} color="#94a3b8" />
            <Text className="font-medium text-xs text-slate-400">Verified</Text>
          </View>
        </View>
        <View className="h-16 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-slate-100/80 px-5">
          <TextInput
            placeholder="Enter Email"
            placeholderTextColor="#94a3b8"
            value={email}
            editable={false}
            selectTextOnFocus={false}
            className="flex-1 font-medium text-slate-600"
          />
          <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
        </View>
      </View>

      {/* Phone Number Field with Country Picker & Down Arrow */}
      <View className="mt-4">
        <Text className="mb-1 font-medium text-slate-400">Phone Number</Text>
        <View className="h-16 flex-row items-center rounded-2xl border border-slate-100 bg-white px-4">
          {/* Country Selector with Flag and Arrow */}
          <View className="flex-row items-center">
            <CountryPicker
              countryCode={countryCode}
              withFilter
              withFlag
              withCallingCode
              withAlphaFilter
              onSelect={(country: Country) => {
                setCountryCode(country.cca2);
                setCallingCode(country.callingCode[0]);
                setPhoneNumber(''); // Clear phone number when country changes to avoid mismatched length
              }}
            />
            {/* Down Arrow Icon */}
            <Ionicons name="chevron-down" size={16} color="#475569" className="ml-1" />
          </View>

          {/* Calling Code Text */}
          <Text className="ml-2 font-medium text-slate-900">+{callingCode}</Text>

          {/* Vertical Separator */}
          <View className="mx-3 h-6 w-[1px] bg-slate-200" />

          {/* Phone Number Input */}
          <TextInput
            placeholder="Enter phone number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, ''))}
            maxLength={getMaxPhoneLength(countryCode)}
            className="h-full flex-1 text-slate-900"
          />
        </View>
      </View>

      {/* Gender Selection */}
      <View className="mt-8">
        <Text className="mb-4 font-medium text-slate-400">Gender (optional)</Text>
        <View className="flex-row justify-between">
          {genders.map((item) => {
            const isSelected = selectedGender === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedGender(item.id)}
                activeOpacity={0.8}
                className="items-center">
                <View
                  className={`h-20 w-20 items-center justify-center rounded-full border-2 bg-white ${
                    isSelected ? 'border-[#F6163C]' : 'border-slate-100'
                  }`}
                  style={{
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}>
                  {isSelected && item.image ? (
                    <Image
                      source={item.image}
                      className="h-full w-full rounded-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons
                      name={item.icon as any}
                      size={32}
                      color={isSelected ? '#F6163C' : '#CBD5E1'}
                    />
                  )}
                </View>
                <Text
                  className={`mt-2 font-medium ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
});

BasicDetails.displayName = 'BasicDetails';

export default BasicDetails;
