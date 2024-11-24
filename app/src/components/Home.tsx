import React, { useState } from "react"
import styled from 'styled-components/native';
import theme from "../styles/theme";
import { Image } from 'react-native';
import { View } from "react-native";
import TrainToggle from "./primary/TrainToggle";
import { Text } from "react-native";
import CactusLogo from "../assets/images/logo_light_grey.png"

import { joinNetwork, leaveNetwork } from '../communications/Sockets';

const MainContent = styled.View`
  flex: 1;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-top: 0px;
  background: ${theme.colors.background};
  `;
  
const HomePage: React.FC = () => {
    const [deviceActive, setDeviceActive] = useState(false);

    const toggleDeviceStatus = () => {
        if (!deviceActive) {
            joinNetwork();
        } else {
            leaveNetwork();
        }
        setDeviceActive(!deviceActive);
    };

    return (
        <MainContent>
            <View>
            <Image source={CactusLogo} style={{height: 120, width: 120}}/>
            </View>
            <TrainToggle isTraining={deviceActive} handleTrainToggle={toggleDeviceStatus}/>
            {/* <EarningsCard earnings={133.71}/> */}
            <Text/>
        </MainContent>
    )
}
export default HomePage