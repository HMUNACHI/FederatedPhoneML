import React, { Dispatch, SetStateAction } from "react"
import CustomButton from "../primary/Button"
import GitHubIcon from '@mui/icons-material/GitHub'; // Import GitHub icon
import { supabase } from "services/supabaseClient";

interface SocialButtonGroupProps {
    setLoading: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
  }

const SocialButtonGroup: React.FC<SocialButtonGroupProps> = ({ setLoading, setError }) => {
    const handleSocialLogin = async (provider: 'github') => {
        setLoading(true);
        setError(null);
    
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/dashboard`, // Adjust as needed
          },
        });
    
        if (error) {
          setError(error.message);
          setLoading(false);
        }
      };
      
    return (
        <CustomButton
          customVariant="secondary"
          onClick={() => handleSocialLogin('github')}
          icon={<GitHubIcon className="mr-2" sx={{ color: 'text.primary', paddingRight: 1 }}/>}
        >
          Continue with GitHub
        </CustomButton>
    )
}

export default SocialButtonGroup