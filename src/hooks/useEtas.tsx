import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Eta, fetchEtas } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import useLanguage from "./useTranslation";
import DbContext from "../context/DbContext";

// `failed` means the request itself rejected. hk-bus-eta swallows most network
// errors and resolves [], so callers also check useOnline before saying "no service".
export const useEtasStatus = (routeId: string, disable: boolean = false) => {
  const { isVisible, refreshInterval } = useContext(AppContext);
  const {
    db: { routeList, stopList, holidays, serviceDayMap },
  } = useContext(DbContext);
  const [routeKey, seq] = routeId.split("/");
  const routeObj = routeList[routeKey] || DefaultRoute;
  const [etas, setEtas] = useState<Eta[] | null>(null);
  const [failed, setFailed] = useState<boolean>(false);
  const language = useLanguage();
  const isMounted = useRef<boolean>(false);

  const fetchData = useCallback(() => {
    if (!isVisible || navigator.userAgent === "prerendering") {
      // skip if prerendering
      setEtas(null);
      return new Promise((resolve) => resolve([]));
    }
    return fetchEtas({
      ...routeObj,
      seq: parseInt(seq, 10),
      stopList,
      language,
      holidays,
      serviceDayMap,
    })
      .then((_etas) => {
        if (isMounted.current) {
          setEtas(_etas);
          setFailed(false);
        }
      })
      .catch(() => {
        if (isMounted.current) setFailed(true);
      });
  }, [isVisible, language, routeObj, seq, stopList, holidays, serviceDayMap]);

  useEffect(() => {
    if (disable) return;
    isMounted.current = true;
    const fetchEtaInterval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    fetchData();

    return () => {
      isMounted.current = false;
      clearInterval(fetchEtaInterval);
    };
  }, [routeId, fetchData, refreshInterval, disable]);

  return { etas, failed, retry: fetchData };
};

export const useEtas = (routeId: string, disable: boolean = false) =>
  useEtasStatus(routeId, disable).etas;

const DefaultRoute = {
  co: [""],
  stops: { "": [""] },
  dest: { zh: "", en: "" },
  bound: "",
  nlbId: 0,
  gtfsId: "",
  fares: [],
  faresHoliday: [],
};
