// Shared UI kit. Screens build from these instead of styling locally
// (report 3.4.4: "components are drawn from a shared library").
import { useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { brand, font, mono, radius, space, type, useTheme } from '../theme/theme';

// ---------- layout ----------

export function Screen({ children, scroll = true, padded = true, edges = ['top'], contentStyle }) {
  const { colors } = useTheme();
  const inner = padded ? { padding: space.md, paddingBottom: 120 } : { paddingBottom: 120 };
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[inner, contentStyle]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, inner, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

// Deep-teal header block used at the top of auth and scan screens.
export function HeroHeader({ title, subtitle, prompt, onBack, right, children }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTop}>
        {onBack ? (
          <IconButton icon="arrow-back" onPress={onBack} color={brand.heroText} label="Go back" />
        ) : <View />}
        {right}
      </View>
      {prompt ? (
        <Text style={{ fontFamily: mono, fontSize: 13, color: brand.accent, marginTop: space.sm }}>$ {prompt}</Text>
      ) : null}
      {title ? <Text style={[type.h1, { color: brand.heroText, marginTop: space.sm }]}>{title}</Text> : null}
      {subtitle ? <Text style={[type.small, { color: brand.heroMuted, marginTop: 6 }]}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

// White sheet with rounded top corners that overlaps a HeroHeader.
export function Sheet({ children, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sheet, { backgroundColor: colors.bg }, style]}>{children}</View>
  );
}

export function Card({ children, style, onPress, tone }) {
  const { colors } = useTheme();
  const bg = tone ? colors[tone] : colors.card;
  const content = <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }}>
      {content}
    </Pressable>
  );
}

export function SectionHeader({ title, actionLabel, onAction, style }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[type.h3, { color: colors.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.row}>
          <Text style={[type.label, { color: colors.textMuted }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------- text & badges ----------

export function T({ variant = 'body', color, style, children, ...rest }) {
  const { colors } = useTheme();
  return <Text style={[type[variant], { color: color || colors.text }, style]} {...rest}>{children}</Text>;
}

export function Muted({ variant = 'small', style, children }) {
  const { colors } = useTheme();
  return <Text style={[type[variant], { color: colors.textMuted }, style]}>{children}</Text>;
}

export function Pill({ label, icon, fg, bg, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {icon ? <Ionicons name={icon} size={13} color={fg} /> : null}
      <Text style={[type.label, { color: fg, fontSize: 12 }]}>{label}</Text>
    </View>
  );
}

// Risk is shown with colour + icon + text together (report: never colour alone).
export function RiskBadge({ level, label, style }) {
  const { colors } = useTheme();
  const r = colors.risk[level];
  return <Pill label={label || level} icon={r.icon} fg={r.fg} bg={r.bg} style={style} />;
}

export function DemoBadge() {
  const { colors } = useTheme();
  return <Pill label="Demo data" icon="flask" fg={colors.skyInk} bg={colors.sky} />;
}

// Pastel circle with an icon in it.
export function IconBubble({ icon, tone = 'mint', size = 44 }) {
  const { colors } = useTheme();
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors[tone],
    }}
    >
      <Ionicons name={icon} size={size * 0.45} color={colors[`${tone}Ink`]} />
    </View>
  );
}

// ---------- buttons ----------

export function Button({ label, onPress, variant = 'primary', icon, loading, disabled, style }) {
  const { colors } = useTheme();
  const v = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    lime: { bg: colors.lime, fg: colors.onLime, border: colors.lime },
    secondary: { bg: 'transparent', fg: colors.text, border: colors.border },
    danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
    hero: { bg: brand.heroText, fg: brand.hero, border: brand.heroText },
  }[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, opacity: off ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={v.fg} /> : null}
          <Text style={[type.bodyMedium, { color: v.fg, fontFamily: font.semibold }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({ icon, onPress, color, label, style }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={label} style={[styles.iconButton, style]}>
      <Ionicons name={icon} size={22} color={color || colors.text} />
    </Pressable>
  );
}

export function TextLink({ label, onPress, color, style }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Text style={[type.label, { color: color || colors.primary }, style]}>{label}</Text>
    </Pressable>
  );
}

// ---------- forms ----------

export function Field({
  label, icon, value, onChangeText, placeholder, secure, error, onDark, style, ...rest
}) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);
  const c = onDark
    ? { label: brand.heroMuted, bg: brand.heroField, border: 'transparent', text: brand.heroText, ph: brand.heroMuted }
    : { label: colors.textMuted, bg: colors.card, border: colors.border, text: colors.text, ph: colors.textMuted };
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <Text style={[type.label, { color: c.label }]}>{label}</Text> : null}
      <View style={[
        styles.field,
        { backgroundColor: c.bg, borderColor: error ? colors.danger : focused ? colors.primary : c.border },
      ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={c.ph} /> : null}
        <TextInput
          style={[type.body, styles.input, { color: c.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.ph}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} accessibilityLabel="Show or hide password">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={c.ph} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[type.caption, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

// Two-option toggle, e.g. Email | Username.
export function Segmented({ options, value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.cardAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: colors.card }]}
          >
            {o.icon ? <Ionicons name={o.icon} size={16} color={active ? colors.text : colors.textMuted} /> : null}
            <Text style={[type.label, { color: active ? colors.text : colors.textMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Banner({ text, tone = 'sky', icon = 'information-circle' }) {
  const { colors } = useTheme();
  const fg = tone === 'danger' ? colors.danger : colors[`${tone}Ink`];
  const bg = tone === 'danger' ? colors.risk.HIGH.bg : colors[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={18} color={fg} />
      <Text style={[type.small, { color: fg, flex: 1 }]}>{text}</Text>
    </View>
  );
}

// ---------- lists ----------

export function ListRow({ icon, tone = 'mint', title, subtitle, onPress, right, danger, last }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress && !right}
      style={({ pressed }) => [
        styles.listRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      {icon ? <IconBubble icon={icon} tone={danger ? 'peach' : tone} size={38} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[type.bodyMedium, { color: danger ? colors.danger : colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[type.caption, { color: colors.textMuted }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </Pressable>
  );
}

export function Toggle({ value, onValueChange }) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.card}
      activeThumbColor={colors.card}
    />
  );
}

export function EmptyState({ icon = 'scan', title, text, actionLabel, onAction }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xl, gap: space.sm }}>
      <IconBubble icon={icon} tone="lavender" size={64} />
      <T variant="h3" style={{ marginTop: space.sm, textAlign: 'center' }}>{title}</T>
      {text ? <Muted style={{ textAlign: 'center', maxWidth: 280 }}>{text}</Muted> : null}
      {actionLabel ? <Button label={actionLabel} onPress={onAction} icon="scan" style={{ marginTop: space.sm, alignSelf: 'stretch' }} /> : null}
    </Card>
  );
}

// ---------- dialogs ----------

// Confirmation dialog (works on web too, unlike Alert.alert with buttons).
export function ConfirmDialog({
  visible, title, message, confirmLabel = 'Confirm', destructive, onConfirm, onCancel, children,
}) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onCancel}>
        <Pressable style={[styles.dialog, { backgroundColor: colors.card }]} onPress={() => {}}>
          <T variant="h2">{title}</T>
          {message ? <Muted variant="body" style={{ marginTop: space.sm }}>{message}</Muted> : null}
          {children}
          <View style={{ gap: space.sm, marginTop: space.lg }}>
            {onConfirm ? (
              <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            ) : null}
            <Button label={onConfirm ? 'Cancel' : 'Close'} variant="secondary" onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function formatDate(iso, withTime = false) {
  const d = new Date(iso);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleString('en-AU', opts);
}

export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} d ago`;
  return formatDate(iso);
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hero: {
    backgroundColor: brand.hero,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xl + space.md,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 40 },
  sheet: {
    marginTop: -space.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: space.lg,
    flexGrow: 1,
  },
  card: { borderRadius: radius.card, padding: space.md + 4 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: space.lg, marginBottom: space.sm + 4,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill,
  },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 52, paddingHorizontal: space.lg, borderRadius: radius.button, borderWidth: 1.5,
  },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  field: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: radius.input, paddingHorizontal: 14, minHeight: 52,
  },
  input: { flex: 1, paddingVertical: 12, outlineStyle: 'none' },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: radius.input + 2, gap: 4 },
  segment: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: radius.input - 2,
  },
  banner: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.tile, alignItems: 'flex-start',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  overlay: { flex: 1, justifyContent: 'center', padding: space.lg },
  dialog: { borderRadius: radius.card, padding: space.lg, maxWidth: 420, width: '100%', alignSelf: 'center' },
});
