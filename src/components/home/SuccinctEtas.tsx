import { useContext } from "react";
import { Box, SxProps, Theme, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEtasStatus } from "../../hooks/useEtas";
import useOnline from "../../hooks/useOnline";
import AppContext from "../../context/AppContext";
import { Eta } from "hk-bus-eta";
import { Schedule as ScheduleIcon } from "@mui/icons-material";
import useLanguage from "../../hooks/useTranslation";
import { getPlatformSymbol } from "../../utils";
import DbContext from "../../context/DbContext";

interface SuccinctEtasProps {
  routeId: string;
  value?: Eta[];
  isEndOfTrainLine?: boolean;
}

const SuccinctEtas = ({
  routeId,
  value = undefined,
  isEndOfTrainLine = false,
}: SuccinctEtasProps) => {
  const { t } = useTranslation();
  const language = useLanguage();
  const { etaFormat, annotateScheduled, platformMode } = useContext(AppContext);
  const {
    db: { routeList },
  } = useContext(DbContext);
  const { etas: _etas, failed } = useEtasStatus(routeId, Boolean(value));
  const offline = useOnline() === "offline";
  const etas = value ?? _etas;
  const isCoop = routeList[routeId.split("/")[0]].co.length > 1;

  const getEtaString = (
    eta: Eta | null,
    seq: number,
    highlight: boolean = false
  ) => {
    if (!eta || !eta.eta) {
      if (isEndOfTrainLine && seq === 0) return t("終點站");
      // only the lead slot speaks; later slots stay blank when there is no next bus
      // an offline fetch resolves [], which must not read as "no service"
      if (seq === 0 && offline) return t("離線");
      if (seq === 0) return eta?.remark?.[language] || t("暫無班次");
      return "";
    } else {
      const waitTime = Math.round(
        (new Date(eta.eta).getTime() - new Date().getTime()) / 60 / 1000
      );
      if (!Number.isInteger(waitTime)) {
        return eta.remark[language];
      }

      const { remark } = eta;
      const isScheduled =
        remark?.zh?.endsWith("班次") || remark?.en?.endsWith("Scheduled Bus");

      const trains =
        (/Platform [\d+] - (▭+)/gm.exec(remark?.en ?? "") ?? [])[1] ?? "";

      const platform =
        [...(remark.en?.matchAll(/Platform (\d+)/g) ?? [])][0] || [];
      let platformSymbol = "";
      if (platform.length === 2 && platform[1].length) {
        // only support single digit number
        platformSymbol =
          getPlatformSymbol(Number(platform[1]), platformMode) + " ";
      }

      const prefixJsx = (
        <>
          <Typography variant="caption">{isCoop && t(eta.co)}&emsp;</Typography>
          {isScheduled && annotateScheduled && (
            <>
              <ScheduleIcon sx={{ fontSize: "0.9em" }} />
              &nbsp;
            </>
          )}
          {platformSymbol}
          {eta.co === "mtr" && eta.dest[language] + " "}
          {trains.length === 1 && <SingleTrainIcon />}
          {trains.length === 2 && <DoubleTrainIcon />}
        </>
      );

      const exactTimeJsx = (
        <Box
          component="span"
          sx={{
            fontSize:
              etaFormat !== "exact" ? "0.9em" : highlight ? "1.5em" : "1em",
            fontWeight: highlight && etaFormat === "exact" ? 700 : undefined,
          }}
        >
          {eta.eta.slice(11, 16)}
        </Box>
      );

      const isTrain = eta.co === "mtr" || eta.co === "lightRail";
      const isDue = waitTime < (isTrain ? 2 : 1);
      const waitTimeJsx = (
        <Box component="span">
          <Box
            component="span"
            sx={{
              ...waitTimeSx,
              // first ETA leads the row; later ones stay at the base size.
              // "due" is a word, not a number, so it keeps the base size
              ...(highlight &&
                !isDue && { fontSize: "1.65em", lineHeight: 1.1 }),
              color: (theme) =>
                highlight ? theme.palette.warning.main : "inherit",
            }}
          >
            {isDue ? t("即將抵達") : `${waitTime} `}
          </Box>
          {!isDue && (
            <Box component="span" sx={{ fontSize: "0.8em" }}>
              {t("分鐘")}
            </Box>
          )}
        </Box>
      );
      return (
        <>
          {prefixJsx}
          {etaFormat === "exact" && exactTimeJsx}
          {etaFormat === "diff" && waitTimeJsx}
          {etaFormat === "mixed" && (
            <>
              {exactTimeJsx}&emsp;{waitTimeJsx}
            </>
          )}
        </>
      );
    }
  };

  return (
    <Box display="flex" flexDirection="column" textAlign="right">
      <Typography component="div" color="textPrimary" sx={primarySx}>
        {etas
          ? getEtaString(etas[0], 0, true)
          : failed || offline
            ? t(offline ? "離線" : "無法載入")
            : t("載入中")}
      </Typography>
      <Typography component="div" color="textSecondary" sx={secondarySx}>
        {etas ? getEtaString(etas[1], 1) : ""}
      </Typography>
      <Typography component="div" color="textSecondary" sx={secondarySx}>
        {etas ? getEtaString(etas[2], 2) : ""}
      </Typography>
    </Box>
  );
};

export const SingleTrainIcon = () => (
  // https://pictogrammers.com/library/mdi/icon/train-car-passenger-door/
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    viewBox="0 0 24 24"
    style={{
      marginRight: 8,
      width: "1em",
      height: "1em",
      verticalAlign: "middle",
      fill: "currentcolor",
    }}
  >
    <path d="M21 7H3C1.9 7 1 7.9 1 9V17H2C2 18.11 2.9 19 4 19S6 18.11 6 17H18C18 18.11 18.9 19 20 19S22 18.11 22 17H23V9C23 7.9 22.11 7 21 7M7 12H3V9H7V12M11 16H9V9H11V16M15 16H13V9H15V16M21 12H17V9H21V12Z" />
  </svg>
);

export const DoubleTrainIcon = () => (
  // https://pictogrammers.com/library/mdi/icon/train-car-passenger-door/
  <>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{
        width: "1em",
        height: "1em",
        verticalAlign: "middle",
        fill: "currentcolor",
      }}
    >
      <path d="M21 7H3C1.9 7 1 7.9 1 9V17H2C2 18.11 2.9 19 4 19S6 18.11 6 17H18C18 18.11 18.9 19 20 19S22 18.11 22 17H23V9C23 7.9 22.11 7 21 7M7 12H3V9H7V12M11 16H9V9H11V16M15 16H13V9H15V16M21 12H17V9H21V12Z" />
    </svg>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      viewBox="0 0 24 24"
      style={{
        marginRight: 8,
        width: "1em",
        height: "1em",
        verticalAlign: "middle",
        fill: "currentcolor",
      }}
    >
      <path d="M21 7H3C1.9 7 1 7.9 1 9V17H2C2 18.11 2.9 19 4 19S6 18.11 6 17H18C18 18.11 18.9 19 20 19S22 18.11 22 17H23V9C23 7.9 22.11 7 21 7M7 12H3V9H7V12M11 16H9V9H11V16M15 16H13V9H15V16M21 12H17V9H21V12Z" />
    </svg>
  </>
);

export default SuccinctEtas;

const primarySx: SxProps<Theme> = {
  whiteSpace: "nowrap",
  fontSize: "1em",
  fontVariantNumeric: "tabular-nums",
};

const secondarySx: SxProps<Theme> = {
  fontSize: "0.875em",
  fontWeight: "400",
  lineHeight: "1.43",
  whiteSpace: "nowrap",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const waitTimeSx: SxProps<Theme> = {
  fontSize: "1.1em",
  fontWeight: "700",
};
