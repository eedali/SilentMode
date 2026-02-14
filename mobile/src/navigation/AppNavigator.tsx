import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import TextFeedScreen from '../screens/TextFeedScreen';
import ImageFeedScreen from '../screens/ImageFeedScreen';
import MixFeedScreen from '../screens/MixFeedScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Text" component={TextFeedScreen} />
                <Tab.Screen name="Image" component={ImageFeedScreen} />
                <Tab.Screen name="Mix" component={MixFeedScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
