import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';

const SurveyLoaderScreen = ({ route }) => {
  const navigation = useNavigation();
  const [percentage, setPercentage] = useState(0);
  const animationValue = useRef(new Animated.Value(0)).current;
  
  // Duration of the loading animation in milliseconds (adjust as needed)
  const ANIMATION_DURATION = 3000; // 3 seconds
  const PAUSE_DURATION = 400; // 0.4 seconds pause

  useEffect(() => {
    // Create a sequence of animations with pauses at 40% and 64%
    Animated.sequence([
      // Animate from 0% to 40%
      Animated.timing(animationValue, {
        toValue: 40,
        duration: ANIMATION_DURATION * 0.4, // 40% of total duration
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      
      // Pause at 40%
      Animated.delay(PAUSE_DURATION),
      
      // Animate from 40% to 64%
      Animated.timing(animationValue, {
        toValue: 64,
        duration: ANIMATION_DURATION * 0.24, // 24% of total duration
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
      
      // Pause at 64%
      Animated.delay(PAUSE_DURATION),
      
      // Animate from 64% to 100%
      Animated.timing(animationValue, {
        toValue: 100,
        duration: ANIMATION_DURATION * 0.36, // 36% of total duration
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    // Update the percentage state as animation progresses
    const listener = animationValue.addListener(({ value }) => {
      setPercentage(Math.floor(value));
    });

    // Calculate total animation time including pauses
    const totalDuration = ANIMATION_DURATION + (PAUSE_DURATION * 2) + 200;

    // Navigate to Main screen when animation completes
    const timer = setTimeout(() => {
      navigation.navigate('Main');
    }, totalDuration); // Add a small delay after animation completes

    // Clean up
    return () => {
      animationValue.removeListener(listener);
      clearTimeout(timer);
    };
  }, []);

  // Calculate the circle's circumference
  const circleSize = 200;
  const radius = circleSize / 2 - 15; // Accounting for stroke width
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the stroke dashoffset based on percentage
  const strokeDashoffset = Animated.multiply(
    Animated.subtract(100, animationValue),
    circumference / 100
  );

  return (
    <LinearGradient colors={['#121212', '#000000']} style={styles.container}>
      <View style={styles.loaderContainer}>
        <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
          <View style={styles.circleContainer}>
            {/* Background circle */}
            <View style={[styles.circleBackground, { width: circleSize, height: circleSize }]} />
            
            {/* Animated progress circle */}
            <Animated.View style={styles.svgContainer}>
              <View style={styles.circleWrapper}>
                <Animated.View 
                  style={[
                    styles.progressCircle, 
                    { 
                      width: circleSize, 
                      height: circleSize,
                      borderRadius: circleSize / 2,
                      borderWidth: 8,
                      borderColor: 'transparent',
                      borderTopColor: '#6200EE',
                      transform: [{ rotate: Animated.multiply(animationValue, 3.6).interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg']
                      }) }]
                    }
                  ]}
                />
              </View>
            </Animated.View>
            
            {/* Percentage text */}
            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>{percentage}%</Text>
            </View>
          </View>
          
          <Text style={styles.messageText}>Analyzing your sleep profile...</Text>
        </BlurView>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    width: 280,
    height: 350,
    borderRadius: 20,
    overflow: 'hidden',
    // Glass-like effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  circleBackground: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  svgContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circleWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'absolute',
  },
  percentageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

export default SurveyLoaderScreen;