import React from "react";
import { StyleSheet, Text, View, Image, Dimensions } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomePage from "../screens/HomeScreens/HomePage";
import AidsScreen from "../screens/HomeScreens/AidsScreen";
import { Ionicons } from "@expo/vector-icons";
import Tracker from "../screens/HomeScreens/Tracker";
import Report from "../screens/HomeScreens/Report"
import Profile from "../screens/HomeScreens/Profile";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import colors from "../theme/colors";
import shadows from "../theme/shadows";

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

const HomeNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomePage"
      screenOptions={{
        headerShown: false, // No header as requested
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 20,
          right: 20,
          elevation: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderTopEndRadius: 25,
          borderTopStartRadius: 25,
          height: 65,
          ...shadows.medium,
          borderTopWidth: 0,
          // overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: "rgba(137, 43, 226, 1)", // Using a more vibrant purple than the accent
        tabBarInactiveTintColor: colors.softWhite,
      }}
    >
      <Tab.Screen
        name="HomePage"
        component={HomePage}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <View style={focused ? styles.activeIconBackground : styles.IconBackground}>
                <Ionicons name="home-outline" size={24} color={color} />
              </View>
              <Text style={[styles.menuText, { color }]}>Home</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AidsScreen"
        component={AidsScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <View style={focused ? styles.activeIconBackground : styles.IconBackground}>
                <Ionicons name="musical-notes-outline" size={24} color={color} />
              </View>
              <Text style={[styles.menuText, { color }]}>Aids</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Tracker"
        component={Tracker}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                colors={["rgba(137, 43, 226, 1)", '#172d99']} // Changed from green to purple
                style={[styles.trackerButton, focused ? styles.activeTrackerButton : null]}
              >
                <Image 
                  source={require('../../assets/Icons/Tracker.png')} 
                  style={styles.trackerIcon} 
                  resizeMode="contain" 
                />
              </LinearGradient>
              <Text style={[styles.menuText, { color }]}>Tracker</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={Report}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <View style={focused ? styles.activeIconBackground : styles.IconBackground}>
                <Ionicons name="pulse-outline" size={24} color={color} />
              </View>
              <Text style={[styles.menuText, { color }]}>Report</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <View style={focused ? styles.activeIconBackground : styles.IconBackground}>
                <Ionicons name="person-circle-outline" size={24} color={color} />
              </View>
              <Text style={[styles.menuText, { color }]}>Profile</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    
  },
  IconBackground: {
    borderRadius: 12,
    padding: 8,
    marginBottom: -5,
  },  
  activeIconBackground: {
    backgroundColor: 'rgba(137, 43, 226, 0.15)', // Changed from green to purple
    borderRadius: 12,
    padding: 8,
    marginBottom: -5,
  },
  trackerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginTop: -15, 
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    ...shadows.light,
  },

  activeTrackerButton: {
    transform: [{ scale: 1.1 }],
  },
  trackerIcon: {
    width: 30,
    height: 30,
  },
  menuText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    width: 40, // Fixed width to prevent overflow
    textAlign: 'center', // Center text to prevent overflow
  },
});

export default HomeNavigator;
