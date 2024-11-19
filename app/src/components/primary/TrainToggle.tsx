import React from "react"
import { View, Text, Switch } from "react-native"
import { useTheme } from "styled-components"

interface TrainToggleProps {
    isTraining: boolean;
    handleTrainToggle: () => void;
    isInitializingSession: boolean;
    isStartingTraining: boolean;
}

const TrainToggle: React.FC<TrainToggleProps> = ({isTraining, handleTrainToggle, isInitializingSession, isStartingTraining }) => {
    const theme = useTheme();
    return (
        <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            <Switch
                style={{ 
                    transform: [{ scaleX: 3 }, { scaleY: 3 }], 
                    shadowColor: isTraining ? theme.colors.success : null, // Color of the shadow
                    shadowOffset: isTraining ? { width: 0, height: 0 } : null, // Offset of the shadow (left-right, up-down)
                    shadowOpacity: isTraining ? 1 : null, // Opacity of the shadow
                    shadowRadius: isTraining ? 1 : null, // Blur radius
                    elevation: isTraining ? 0 : null, // Android elevation for shadow
                }}
                onValueChange={handleTrainToggle}
                disabled={isInitializingSession || isStartingTraining}
                trackColor={{isTraining: theme.colors.text, true: theme.colors.success}}
                thumbColor={theme.colors.text}
                ios_backgroundColor="#3e3e3e"
                value={isTraining}
                mode={isTraining ? 'contained' : 'outlined'}
            />
            <Text 
                style={{
                    color: isTraining ? theme.colors.success : theme.colors.text, 
                    paddingTop: 30,
                    // fontFamily: 'Poppins-Regular',
                    marginTop: 20
                }}
            >
                {isTraining ? 'Connected to the grid!' : 'Offline'}
            </Text>
        </View>
    )
}

export default TrainToggle