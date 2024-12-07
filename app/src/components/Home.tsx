import React, { useEffect, useState } from "react"
import theme from "../styles/theme";

import { Image } from 'react-native';
import { View } from "react-native";
import { Text } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import { MainContent } from "../styles/Style";
import TrainToggle from "./primary/TrainToggle";
import CustomButton from "./primary/Button";
import CactusLogo from "../assets/images/logo_light_grey.png"

import { joinNetwork, leaveNetwork } from "../communications/Sockets";
import { handleLogout } from "./Outh";
import { fetchDeviceAvailability, toggleDeviceAvailability } from "../communications/Supabase";


const HomePage: React.FC = () => {
    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [deviceActive, setDeviceActive] = useState(false);

    const toggleDeviceStatus = () => {
        const availability = deviceActive ? 'available' : 'unavailable'
        toggleDeviceAvailability(availability).then((newAvailability) => {
            setDeviceActive(newAvailability === 'available')
            switch (newAvailability) {
                case 'available':
                    joinNetwork();
                case 'unavailable':
                    leaveNetwork();
            }
        })
    };

    useEffect(() => {
        fetchDeviceAvailability().then((availability) => {
            setLoadingAvailability(false)
            setDeviceActive(availability === 'available')
            if (availability === 'available'){joinNetwork()}
        })
    }, [])

    return (
        <MainContent>
            <View>
            <Image source={CactusLogo} style={{height: 120, width: 120}}/>
            </View>
            {loadingAvailability ? <ActivityIndicator color={theme.colors.primary} size='large'/> : <TrainToggle isTraining={deviceActive} handleTrainToggle={toggleDeviceStatus}/>}
            {/* <EarningsCard earnings={133.71}/> */}
            <Text/>
            <CustomButton onPress={handleLogout}>Sign out</CustomButton>
        </MainContent>
    )
}
export default HomePage