import { supabase } from "../communications/Supabase";

export async function getCurrentDeviceID(): Promise<string> {
    // https://www.notion.so/TODO-Engineering-reminders-148d8e920c9780fb8af0c558296e1bd2?pvs=4#148d8e920c97804b8f1ce73c33812ab9
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (!sessionError){
        const { data: deviceData, error: deviceLoadError } = await supabase
            .from('devices')
            .select('id')
            .eq('user_id', sessionData.session?.user.id)
            .limit(1);
        if (!deviceLoadError) {
            return deviceData[0].id
        }
    }
    console.warn('Cant fetch device name!')
    return 'device_name_unknown'
}