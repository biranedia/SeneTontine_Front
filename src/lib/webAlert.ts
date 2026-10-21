// src/lib/webAlert.ts — Sur le web, Alert.alert de React Native n'affiche rien : on le
// remplace par les boîtes de dialogue du navigateur (alert / confirm). Sans effet sur mobile.
import { Alert, AlertButton, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const actions = buttons ?? [];
    const cancel = actions.find((b) => b.style === 'cancel');
    const confirmBtn = actions.find((b) => b.style !== 'cancel');
    if (actions.length > 1 && confirmBtn) {
      if (window.confirm(text)) confirmBtn.onPress?.();
      else cancel?.onPress?.();
    } else {
      window.alert(text);
      actions[0]?.onPress?.();
    }
  };
}
