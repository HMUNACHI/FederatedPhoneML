import React, { useEffect, useState } from "react"
import styled from 'styled-components/native';
import theme from "../styles/theme";
import { Image } from 'react-native';
import { View } from "react-native";
import TrainToggle from "./primary/TrainToggle";
import { Text } from "react-native";
import CactusLogo from "../assets/images/logo_light_grey.png"

import { joinNetwork, leaveNetwork } from '../communications/Sockets';

import { handleLogout } from "./Outh";
import { fetchDeviceAvailability, toggleDeviceAvailability } from "../communications/Supabase";
import CustomButton from "./primary/Button";

const MainContent = styled.View`
  flex: 1;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-top: 0px;
  background: ${theme.colors.background};
`;

const HomePage: React.FC = () => {
    const [loadingAvailability, setLoadingAvailability] = useState(true);
    const [deviceActive, setDeviceActive] = useState(false);

    const toggleDeviceStatus = () => {
        const availability = deviceActive ? 'available' : 'unavailable'
        toggleDeviceAvailability(availability).then((newAvailability) => {
            setDeviceActive(newAvailability === 'available')
        })
    };

    useEffect(() => {
        fetchDeviceAvailability().then((availability) => {
            setLoadingAvailability(false)
            setDeviceActive(availability === 'available')
        })
    }, [])

    return (
        <MainContent>
            <View>
            <Image source={CactusLogo} style={{height: 120, width: 120}}/>
            </View>
            {/* <TrainToggle isTraining={deviceActive} handleTrainToggle={toggleDeviceStatus}/> */}
            <TrainToggle loading={loadingAvailability} isTraining={deviceActive} handleTrainToggle={toggleDeviceStatus}/>
            {/* <EarningsCard earnings={133.71}/> */}
            <Text/>
            <CustomButton onPress={handleLogout}>Logout</CustomButton>
        </MainContent>
    )
}
export default HomePage