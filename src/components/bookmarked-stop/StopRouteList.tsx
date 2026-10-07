import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  List,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import SuccinctTimeReport from "../home/SuccinctTimeReport";
import { useStopEtas } from "../../hooks/useStopEtas";
import { Company } from "hk-bus-eta";

interface StopRouteListProps {
  stops: Array<[Company, string]>; // [[co, stopId]]
  isFocus: boolean;
}

const StopRouteList = ({ stops, isFocus }: StopRouteListProps) => {
  const { t } = useTranslation();
  const stopEtas = useStopEtas({ stopKeys: stops, disabled: !isFocus });
  // an empty result is indistinguishable from "still loading", so stop spinning after a while
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    if (stopEtas.length > 0 || !isFocus) {
      setGaveUp(false);
      return;
    }
    const id = setTimeout(() => setGaveUp(true), 10000);
    return () => clearTimeout(id);
  }, [stopEtas.length, isFocus]);

  if (stopEtas.length === 0) {
    return (
      <Box sx={loadingContainerSx}>
        {gaveUp ? (
          <Typography sx={{ my: 5 }}>{t("暫無班次")}</Typography>
        ) : (
          <CircularProgress sx={{ my: 5 }} aria-label={t("載入中")} />
        )}
      </Box>
    );
  }

  return (
    <List>
      {stopEtas.map(([route, etas]) => (
        <SuccinctTimeReport key={route} routeId={route} etas={etas} />
      ))}
    </List>
  );
};

export default StopRouteList;

const loadingContainerSx: SxProps<Theme> = {
  display: "flex",
  flex: 1,
  justifyContent: "center",
};
