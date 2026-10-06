import { Image } from "expo-image";
import { View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { FOTO_MASCOTA_FALLBACK } from "@/constants/petmatch";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { resolveFotoUrl } from "@/services/api";
import { getMatchCardStyles } from "./match-card.styles";

interface PhotoComparisonProps {
  fotoMascota?: string | null;
  fotoAvistamiento?: string | null;
}

function FotoColumna({ label, url }: { label: string; url?: string | null }) {
  const styles = useThemedStyles(getMatchCardStyles);
  return (
    <View style={styles.photoCol}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.photoLabel}>
        {label}
      </ThemedText>
      <Image
        source={{ uri: resolveFotoUrl(url) || FOTO_MASCOTA_FALLBACK }}
        style={styles.comparePhoto}
        contentFit="cover"
        accessibilityLabel={label}
      />
    </View>
  );
}

/** Comparación lado a lado: mascota perdida vs. animal avistado. */
export function PhotoComparison({ fotoMascota, fotoAvistamiento }: PhotoComparisonProps) {
  const styles = useThemedStyles(getMatchCardStyles);
  return (
    <View style={styles.photosComparison}>
      <FotoColumna label="Tu Mascota" url={fotoMascota} />
      <View style={styles.vsBadge}>
        <ThemedText style={styles.vsText}>VS</ThemedText>
      </View>
      <FotoColumna label="Visto en calle" url={fotoAvistamiento} />
    </View>
  );
}
