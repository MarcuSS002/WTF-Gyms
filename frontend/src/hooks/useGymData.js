import { useEffect, useRef, useState } from 'react';
import useWebSocket from './useWebSocket';
import { fetchGyms, fetchGymLive, fetchAnomalies } from '../services/api';

const RESOLVED_VISIBLE_MS = 24 * 60 * 60 * 1000;
const ACTIVITY_EVENT_TYPES = ['CHECKIN_EVENT', 'CHECKOUT_EVENT', 'PAYMENT_EVENT'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function keepVisibleAnomalies(list) {
  const now = Date.now();
  return (Array.isArray(list) ? list : []).filter((a) => {
    if (!a || !a.id) return false;
    if (!a.resolved) return true;
    const resolvedAt = a.resolved_at ? Date.parse(a.resolved_at) : NaN;
    if (Number.isNaN(resolvedAt)) return false;
    return now - resolvedAt <= RESOLVED_VISIBLE_MS;
  });
}

function normalizeActivityEvents(list, selectedGymId) {
  const gymId = selectedGymId == null ? null : String(selectedGymId);
  const grouped = { CHECKIN_EVENT: [], CHECKOUT_EVENT: [], PAYMENT_EVENT: [] };

  (Array.isArray(list) ? list : [])
    .filter((ev) => ev && ACTIVITY_EVENT_TYPES.includes(ev.type))
    .filter((ev) => !gymId || String(ev.gym_id || gymId) === gymId)
    .map((ev) => ({
      ...ev,
      gym_id: ev.gym_id || gymId,
      ts: ev.ts || ev.timestamp || new Date().toISOString(),
    }))
    .forEach((ev) => {
      grouped[ev.type].push(ev);
    });

  const merged = [];
  let index = 0;
  while (merged.length < 20) {
    let added = false;
    for (const type of ACTIVITY_EVENT_TYPES) {
      const nextEvent = grouped[type][index];
      if (nextEvent) {
        merged.push(nextEvent);
        added = true;
        if (merged.length === 20) break;
      }
    }
    if (!added) break;
    index += 1;
  }

  return merged;
}

// Centralized gym data hook: selected gym, live snapshot, feed, anomalies
export default function useGymData() {
  const [gyms, setGyms] = useState([]);
  const [selectedGym, _setSelectedGym] = useState(null);
  const [live, setLive] = useState(null);
  const [feed, setFeed] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [lastSwitchMs, setLastSwitchMs] = useState(null);
  const mountedRef = useRef(true);
  const pendingSwitchRef = useRef(null);
  const switchStartRef = useRef(0);
  const selectedGymNameRef = useRef(null);
  const selectedGymRef = useRef(null);

  const refreshAfterReset = async () => {
    let nextGyms = [];
    for (let i = 0; i < 6; i += 1) {
      try {
        const list = await fetchGyms();
        if (Array.isArray(list) && list.length > 0) {
          nextGyms = list;
          break;
        }
      } catch (_) {
        // retry while reset transaction settles
      }
      await sleep(300);
    }

    setGyms(nextGyms);

    const currentSelected = selectedGymRef.current == null ? null : String(selectedGymRef.current);
    const stillExists = currentSelected && nextGyms.some((g) => String(g.id) === currentSelected);

    let nextSelected = currentSelected;
    if (!stillExists) {
      const byName = selectedGymNameRef.current
        ? nextGyms.find((g) => String(g.name || '').trim() === String(selectedGymNameRef.current || '').trim())
        : null;
      nextSelected = byName ? String(byName.id) : (nextGyms[0] ? String(nextGyms[0].id) : null);
      _setSelectedGym(nextSelected);
    }

    if (nextSelected) {
      for (let i = 0; i < 6; i += 1) {
        try {
          const d = await fetchGymLive(nextSelected);
          setLive(d);
          setFeed(normalizeActivityEvents(d?.recent_events, nextSelected));
          break;
        } catch (_) {
          await sleep(300);
        }
      }
    } else {
      setLive(null);
      setFeed([]);
    }

    fetchAnomalies().then((list) => {
      const active = Array.isArray(list) ? list.filter((a) => !a.resolved) : [];
      setAnomalies(keepVisibleAnomalies(active));
    }).catch(() => {});
  };

  // websocket hook delivers events globally
  const onEvent = (ev) => {
    console.debug('useGymData onEvent', ev, 'selectedGym=', selectedGym);
    const isActivityEvent = ev && ACTIVITY_EVENT_TYPES.includes(ev.type);

    if (ev && ev.type === 'SIMULATOR_RESET') {
      refreshAfterReset();
      return;
    }

    // push only activity events to feed for selected gym and keep max 20
    if (isActivityEvent && selectedGym && String(ev.gym_id) === String(selectedGym)) {
      setFeed(prev => [{ ...ev, ts: ev.timestamp || new Date().toISOString() }, ...prev].slice(0, 20));
    }

    if (ev && (ev.type === 'CHECKIN_EVENT' || ev.type === 'CHECKOUT_EVENT') && ev.gym_id != null) {
      setGyms(prev => prev.map(g =>
        String(g.id) === String(ev.gym_id)
          ? { ...g, current_occupancy: Number(ev.current_occupancy ?? g.current_occupancy), capacity_pct: Number(ev.capacity_pct ?? g.capacity_pct) }
          : g
      ));
    }

    // anomaly updates from websocket
    if (ev && ev.type === 'ANOMALY_DETECTED') {
      const anomaly = {
        id: ev.anomaly_id,
        gym_id: ev.gym_id,
        gym_name: ev.gym_name,
        type: ev.anomaly_type,
        severity: ev.severity,
        message: ev.message,
        resolved: false,
        detected_at: ev.detected_at || new Date().toISOString(),
      };
      setAnomalies((prev) => keepVisibleAnomalies([anomaly, ...prev.filter((a) => String(a.id) !== String(anomaly.id))]));
    }

    if (ev && ev.type === 'ANOMALY_RESOLVED') {
      setAnomalies((prev) => keepVisibleAnomalies(prev.map((a) =>
        String(a.id) === String(ev.anomaly_id)
          ? { ...a, resolved: true, resolved_at: ev.resolved_at || new Date().toISOString() }
          : a
      )));
    }

    // update selected gym live if matches
    if (selectedGym && String(ev.gym_id) === String(selectedGym)) {
      if (ev.type === 'CHECKIN_EVENT' || ev.type === 'CHECKOUT_EVENT') {
        setLive(prev => prev ? ({ ...prev, occupancy: { ...prev.occupancy, count: ev.current_occupancy, percentage: ev.capacity_pct } }) : prev);
      }
      if (ev.type === 'PAYMENT_EVENT') {
        setLive(prev => prev ? ({ ...prev, today_revenue: ev.today_total || prev.today_revenue }) : prev);
      }
    }
  };

  const { connected, subscribeGym, unsubscribeGym } = useWebSocket(onEvent);

  // load gyms on mount
  useEffect(() => {
    let m = true;
    fetchGyms().then(list => { if (m) setGyms(list); }).catch(()=>{});
    fetchAnomalies().then((a) => {
      if (!m) return;
      const unresolvedOnly = (Array.isArray(a) ? a : []).filter((x) => !x.resolved);
      setAnomalies(keepVisibleAnomalies(unresolvedOnly));
    }).catch(()=>{});
    return () => { m = false; };
  }, []);

  // when selectedGym changes, fetch snapshot and subscribe
  useEffect(() => {
    // use string id directly (UUID from API)
    const gymId = selectedGym == null ? null : String(selectedGym).trim();
    console.debug('useGymData selectedGym effect ->', selectedGym, 'normalized->', gymId);

    if (!gymId) {
      // clear gym-scoped views when no gym selected
      setLive(null);
      setFeed([]);
      // keep global anomalies visible
      // clear any pending switch
      pendingSwitchRef.current = null;
      setIsSwitching(false);
      return;
    }

    // immediately narrow feed to selected gym so widgets update instantly
    setFeed(prev => prev.filter(ev => ev && String(ev.gym_id) === gymId));

    let mounted = true;
    // immediate fetch for sub-500ms update
    fetchGymLive(gymId).then(d => {
      if (mounted) {
        console.debug('fetchGymLive result', gymId, d);
        setLive(d);
        setFeed(normalizeActivityEvents(d?.recent_events, gymId));
        // if this fetch corresponds to a pending switch, mark switching done
        if (pendingSwitchRef.current === gymId) {
          const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - (switchStartRef.current || 0);
          console.debug('gym switch completed', gymId, 'elapsed_ms', elapsed);
          setLastSwitchMs(Math.round(elapsed));
          setIsSwitching(false);
          pendingSwitchRef.current = null;
        }
      }
    }).catch((e)=>{ console.warn('fetchGymLive failed', e); });

    // fetch global active anomalies for table view
    fetchAnomalies().then(list => {
      if (!mounted) return;
      const active = Array.isArray(list) ? list.filter(a => !a.resolved) : [];
      console.debug('fetchAnomalies active count', active.length);
      setAnomalies(keepVisibleAnomalies(active));
    }).catch((e)=>{ console.warn('fetchAnomalies failed', e); });

    // subscribe to websocket updates for this gym
    subscribeGym(gymId);
    return () => { mounted = false; unsubscribeGym(gymId); };
  }, [selectedGym]);

  useEffect(() => {
    const current = selectedGym == null ? null : String(selectedGym);
    selectedGymRef.current = current;
    if (!current || !Array.isArray(gyms) || gyms.length === 0) return;
    const selected = gyms.find((g) => String(g.id) === current);
    selectedGymNameRef.current = selected ? selected.name : selectedGymNameRef.current;
  }, [selectedGym, gyms]);

  // cleanup
  useEffect(() => () => { mountedRef.current = false; }, []);

  // expose a safe setter that uses string IDs (UUIDs from API)
  const setSelectedGym = (val) => {
    console.debug('setSelectedGym called with', val, 'type', typeof val);
    if (val === null || val === undefined || val === '') {
      pendingSwitchRef.current = null;
      setIsSwitching(false);
      return _setSelectedGym(null);
    }
    // IDs are UUID strings from API, not numbers
    const id = String(val).trim();
    if (!id) {
      console.warn('setSelectedGym received empty id:', val);
      pendingSwitchRef.current = null;
      setIsSwitching(false);
      return _setSelectedGym(null);
    }
    // start switch timer and mark pending
    pendingSwitchRef.current = id;
    switchStartRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setIsSwitching(true);
    _setSelectedGym(id);
  };

  return {
    gyms,
    selectedGym,
    setSelectedGym,
    live,
    feed,
    anomalies,
    setAnomalies,
    refreshAfterReset,
    isSwitching,
    lastSwitchMs,
    connected,
  };
}
