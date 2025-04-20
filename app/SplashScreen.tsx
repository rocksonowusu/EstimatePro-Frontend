import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  


  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');

        Animated.sequence([
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(2000),
        ]).start(() => {
          if (hasSeen === 'true') {
            router.replace('/(tabs)/history'); 
          } else {
            router.replace('/(auth)/onboarding'); 
          }
        });
      } catch (error) {
        console.error('Error reading onboarding status:', error);
        router.replace('/(auth)/onboarding'); 
      }
    };

    checkOnboardingStatus();
  }, []);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" style="light" />
      <LinearGradient
        colors={['#6C5CE7', '#8E5CE7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.View 
          style={[
            styles.logoContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons 
              name="calculator-variant" 
              size={60} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={styles.appName}>EstimatePro</Text>
        <Text style={styles.tagline}>Streamlining Your Estimates</Text>
        </Animated.View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBackground: {
    width: 110,
    height: 110,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  }
});
