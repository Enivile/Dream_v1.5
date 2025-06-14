import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoaderScreen from "../screens/LoaderScreen";
import VideoScreen from "../screens/VideoScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import SurveyScreen from "../screens/SurveyScreen";
import SurveyLoaderScreen from "../screens/SurveyLoaderScreen";
import HomeNavigator from "./HomeNavigator";
import MultiSoundPlayer from "../screens/Player/MultiSoundPlayer";
import MiniPlayer from "../screens/Player/MiniPlayer";
import MainPlayer from "../screens/Player/MainPlayer";
import Sleeppedia from "../screens/Sleeppedia";
import InsomniaDetail from "../screens/Sleeppedia/InsomniaDetail";
import HypersomniaDetail from "../screens/Sleeppedia/HypersomniaDetail";
import SnoringDetail from "../screens/Sleeppedia/SnoringDetail";
import BreathingDetail from "../screens/Sleeppedia/BreathingDetail";
import BruxismDetail from "../screens/Sleeppedia/BruxismDetail";
import RestlessLegDetail from "../screens/Sleeppedia/RestlessLegDetail";
import { useMiniPlayer } from "../context/MiniPlayerContext";
import { useBackgroundMusic } from "../context/BackgroundMusicContext";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { miniPlayerVisible, showMiniPlayer, hideMiniPlayer } = useMiniPlayer();
  const { playBackgroundMusic, stopBackgroundMusic } = useBackgroundMusic();
  const [expanded, setExpanded] = React.useState(false);

  const handleExpand = () => setExpanded(true);
  const handleCollapse = () => setExpanded(false);

  // Start playing background music when the app loads
  useEffect(() => {
    playBackgroundMusic();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Loader"
        screenListeners={{
          state: (e) => {
            // Check if navigating to the Main screen (which contains HomeNavigator)
            const currentRouteName = e.data.state.routes[e.data.state.index]?.name;
            if (currentRouteName === 'Main') {
              // Stop background music when navigating to Main (which contains HomePage)
              stopBackgroundMusic();
            }
          },
        }}
      >
        <Stack.Screen name="Loader" component={LoaderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Video" component={VideoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Survey" component={SurveyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SurveyLoader" component={SurveyLoaderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={HomeNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="MainPlayer" component={MainPlayer} options={{ headerShown: false }} />
        <Stack.Screen name="Player" component={MultiSoundPlayer} options={{ headerShown: false }} />
        <Stack.Screen name="Sleeppedia" component={Sleeppedia} options={{ headerShown: false }} />
        <Stack.Screen name="InsomniaDetail" component={InsomniaDetail} options={{ headerShown: false }} />
        <Stack.Screen name="HypersomniaDetail" component={HypersomniaDetail} options={{ headerShown: false }} />
        <Stack.Screen name="SnoringDetail" component={SnoringDetail} options={{ headerShown: false }} />
        <Stack.Screen name="BreathingDetail" component={BreathingDetail} options={{ headerShown: false }} />
        <Stack.Screen name="BruxismDetail" component={BruxismDetail} options={{ headerShown: false }} />
        <Stack.Screen name="RestlessLegDetail" component={RestlessLegDetail} options={{ headerShown: false }} />
      </Stack.Navigator>
      {miniPlayerVisible && !expanded && (
        <MiniPlayer onExpand={handleExpand} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
