import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Battery from 'expo-battery';
import * as BatteryWarningService from '../utils/batteryWarningService';
import CircularProgressIndicator from 'react-native-circular-progress-indicator';

const { width, height } = Dimensions.get('window');

// Min and max values for the battery warning threshold
const MIN_THRESHOLD = 5;
const MAX_THRESHOLD = 50;

const BatteryWarningModal = ({ visible, onClose }) => {
  const [selectedPercentage, setSelectedPercentage] = useState(20);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load current settings and battery info when modal opens
  useEffect(() => {
    if (visible) {
      loadSettings();
      loadBatteryInfo();
    }
  }, [visible]);

  // Load current battery warning settings
  const loadSettings = async () => {
    try {
      const enabled = await BatteryWarningService.isWarningEnabled();
      const threshold = await BatteryWarningService.getWarningThreshold();
      setIsEnabled(enabled);
      setSelectedPercentage(threshold);
    } catch (error) {
      console.error('Error loading battery warning settings:', error);
    }
  };

  // Load current battery information
  const loadBatteryInfo = async () => {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      setCurrentBatteryLevel(Math.round(batteryLevel * 100));
    } catch (error) {
      console.error('Error loading battery info:', error);
      setCurrentBatteryLevel(null);
    }
  };

  // Toggle battery warning on/off
  const handleToggleEnabled = async () => {
    try {
      setIsLoading(true);
      if (isEnabled) {
        await BatteryWarningService.disableWarning();
        setIsEnabled(false);
        Alert.alert('Success', 'Battery warning disabled');
      } else {
        await BatteryWarningService.enableWarning(selectedPercentage);
        setIsEnabled(true);
        Alert.alert('Success', `Battery warning enabled at ${selectedPercentage}%`);
      }
    } catch (error) {
      console.error('Error toggling battery warning:', error);
      Alert.alert('Error', 'Failed to update battery warning settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Update warning percentage
  const handlePercentageChange = async (percentage) => {
    try {
      // Round to nearest 5%
      const roundedPercentage = Math.round(percentage / 5) * 5;
      // Ensure value is within bounds
      const validPercentage = Math.max(MIN_THRESHOLD, Math.min(MAX_THRESHOLD, roundedPercentage));
      
      setSelectedPercentage(validPercentage);
      if (isEnabled) {
        await BatteryWarningService.setWarningThreshold(validPercentage);
        // Restart monitoring with new threshold
        await BatteryWarningService.enableWarning(validPercentage);
      }
    } catch (error) {
      console.error('Error updating percentage:', error);
      Alert.alert('Error', 'Failed to update warning percentage');
    }
  };

  // Test notification
  const handleTestNotification = async () => {
    try {
      setIsLoading(true);
      const success = await BatteryWarningService.sendTestNotification();
      if (success) {
        Alert.alert('Test Successful', 'Battery warning notification sent!');
      } else {
        Alert.alert('Test Failed', 'Could not send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <BlurView intensity={20} style={styles.blurContainer}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Battery Warning</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Current Battery Level */}
              <View style={styles.batteryInfoContainer}>
                <View style={styles.batteryIconContainer}>
                  <Ionicons name="battery-half-outline" size={32} color="#0D47A1" />
                </View>
                <View style={styles.batteryTextContainer}>
                  <Text style={styles.batteryLabel}>Current Battery Level</Text>
                  <Text style={styles.batteryLevel}>
                    {currentBatteryLevel !== null ? `${currentBatteryLevel}%` : 'Loading...'}
                  </Text>
                </View>
              </View>

              {/* Enable/Disable Toggle */}
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Enable Battery Warning</Text>
                <TouchableOpacity
                  style={[styles.toggleButton, isEnabled && styles.toggleButtonActive]}
                  onPress={handleToggleEnabled}
                  disabled={isLoading}
                >
                  <View style={[styles.toggleIndicator, isEnabled && styles.toggleIndicatorActive]} />
                </TouchableOpacity>
              </View>

              {/* Percentage Selection */}
              <View style={styles.percentageContainer}>
                <Text style={styles.percentageLabel}>Warning Threshold</Text>
              </View>

              {/* Info Text */}
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#666" />
                <Text style={styles.infoText}>
                  Battery warnings will only work when the app is running in the background.
                  Make sure to enable background app refresh for this app.
                </Text>
              </View>
            </ScrollView>
          </View>
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContainer: {
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  batteryInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 71, 161, 0.1)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(13, 71, 161, 0.3)',
  },
  batteryIconContainer: {
    marginRight: 15,
  },
  batteryTextContainer: {
    flex: 1,
  },
  batteryLabel: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 5,
  },
  batteryLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D47A1',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  toggleLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    padding: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#0D47A1',
  },
  toggleIndicator: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleIndicatorActive: {
    alignSelf: 'flex-end',
  },
  percentageContainer: {
    marginBottom: 25,
  },
  percentageLabel: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    marginBottom: 5,
  },
  percentageDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
  },
  circularSliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
});

export default BatteryWarningModal;