// Floating bottom tab bar. Active tab = teal pill with icon + label.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { font, useTheme } from '../theme/theme';

export const TAB_ICONS = {
  Home: 'home',
  Scan: 'scan',
  History: 'time',
  Tips: 'bulb',
  Profile: 'person',
};

export default function NavigationBar({ state, navigation }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: colors.card, shadowColor: '#0A1A1B' }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = TAB_ICONS[route.name];
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={route.name}
              style={[styles.tab, focused && { backgroundColor: colors.primary, flex: 1.6 }]}
            >
              <Ionicons
                name={focused ? icon : `${icon}-outline`}
                size={20}
                color={focused ? colors.onPrimary : colors.textMuted}
              />
              {focused ? (
                <Text style={[styles.label, { color: colors.onPrimary }]} numberOfLines={1}>{route.name}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 6,
    gap: 4,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 22,
  },
  label: { fontFamily: font.semibold, fontSize: 13 },
});
